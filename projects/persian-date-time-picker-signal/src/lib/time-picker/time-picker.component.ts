import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  HostListener,
  Injector,
  OnDestroy,
  OnInit,
  runInInjectionContext,
  signal,
  computed,
  effect,
  input,
  output,
  viewChild
} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { CdkOverlayOrigin, ConnectedOverlayPositionChange, OverlayModule } from '@angular/cdk/overlay';
import { slideMotion } from '../utils/animation/slide';
import { LanguageLocale } from '../utils/models';
import { PersianDateTimePickerService } from '../persian-date-time-picker.service';
import { DateAdapter, GregorianDateAdapter, JalaliDateAdapter } from '../date-adapter';
import { TimeConfig, TimeFormat, TimeValueType } from '../utils/types';
import { DEFAULT_DATE_PICKER_POSITIONS, NzConnectedOverlayDirective } from "../utils/overlay/overlay";
import { NgTemplateOutlet } from '@angular/common';
import { DateMaskDirective } from '../utils/input-mask.directive';

@Component({
  selector: 'persian-time-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgTemplateOutlet,
    DateMaskDirective,
    OverlayModule,
    NzConnectedOverlayDirective
],
  providers: [
    PersianDateTimePickerService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePickerComponent),
      multi: true
    }
  ],
  host: {
    '(click)': 'open()'
  },
  animations: [slideMotion]
})
export class TimePickerComponent implements ControlValueAccessor, OnInit, OnDestroy {

  // ========== Input Signals ==========
  placeholder = input<string | undefined>(undefined);
  rtl = input(false);
  placement = input<'left' | 'right'>('right');
  minTime = input<string | undefined>(undefined);
  maxTime = input<string | undefined>(undefined);
  lang = input<LanguageLocale | undefined>(undefined);
  valueType = input<TimeValueType>('string');
  cssClass = input('');
  showIcon = input(true);
  dateAdapter = input<DateAdapter<Date> | undefined>(undefined);
  inline = input(false);
  disableInputMask = input(false);
  disabled = input(false);
  disabledTimesFilter = input<(date: Date) => boolean>();
  allowEmpty = input(true);
  readOnly = input(false);
  readOnlyInput = input(false);
  displayFormat = input('hh:mm a');
  showTimePicker = input(false);


  // NOTE: 'value' and 'selectedDate' inputs from original code are better handled
  // via ControlValueAccessor or specific logic.
  // The 'value' setter was for setting initial value.
  // We can use a model or just input if we want one-way sync, but for now let's keep it as internal state
  // or additional input if needed.
  // Original had @Input() set selectedDate.
  selectedDateInput = input<Date | null>(null, { alias: 'selectedDate' });
  // Original had @Input() set value, but also a getter.
  // We'll treat 'value' input as initial config if provided, but main sync is CVA.
  valueInput = input<Date | string | null>(null, { alias: 'value' });

  // ========== Output Signals ==========
  timeChange = output<Date | string>();
  openChange = output<boolean>();

  // ========== Queries ==========
  timePickerInput = viewChild<ElementRef<HTMLInputElement>>('timePickerInput');
  popupWrapper = viewChild<ElementRef<HTMLDivElement>>('popupWrapper');

  // ========== State Signals ==========
  isOpen = signal(false);
  selectedTime = signal<TimeConfig>({
    hour: 12,
    minute: 0,
    second: 0,
    period: ''
  });

  // Internal State
  _value: string | Date | null = null;
  _selectedDate: Date | null = new Date();

  form?: FormGroup;
  origin?: CdkOverlayOrigin;
  overlayPositions = [...DEFAULT_DATE_PICKER_POSITIONS];
  private timeoutId: number | null = null;

  minutes: number[] = Array.from({ length: 60 }, (_, i) => i);
  seconds: number[] = Array.from({ length: 60 }, (_, i) => i);

  // Computed
  effectiveLang = computed(() => {
    const l = this.lang();
    if (l) return l;
    return this.rtl() ? this.persianDateTimePickerService.persianLocale : this.persianDateTimePickerService.englishLocale;
  });

  effectiveDateAdapter = computed(() => {
    const adapter = this.dateAdapter();
    if (adapter) return adapter;
    return this.rtl() ? this.jalaliDateAdapter : this.gregorianDateAdapter;
  });

  periods = computed(() => {
    const l = this.effectiveLang();
    return [l.am, l.pm];
  });

  effectivePlaceholder = computed(() => {
    const p = this.placeholder();
    if (p) return p;
    return this.effectiveLang().selectTime;
  });

  timeFormat = computed<TimeFormat>(() => {
    const fmt = this.displayFormat();
    const has24HourFormat = /\bH{1,2}\b/.test(fmt);
    return has24HourFormat ? '24' : '12';
  });

  showSeconds = computed(() => this.displayFormat().toLowerCase().includes('s'));

  hours = computed(() => {
    return this.timeFormat() === '12'
      ? Array.from({ length: 12 }, (_, i) => i + 1)
      : Array.from({ length: 24 }, (_, i) => i);
  });

  displayTime = computed(() => {
    const time = this.selectedTime();
    const h = time.hour.toString().padStart(2, '0');
    const m = time.minute.toString().padStart(2, '0');
    const s = time.second.toString().padStart(2, '0');
    return this.showSeconds() ? `${h}:${m}:${s}` : `${h}:${m}`;
  });

  constructor(public formBuilder: FormBuilder, public elementRef: ElementRef, public injector: Injector, public changeDetectorRef: ChangeDetectorRef, public persianDateTimePickerService: PersianDateTimePickerService, public jalaliDateAdapter: JalaliDateAdapter, public gregorianDateAdapter: GregorianDateAdapter) {
    this.initializeForm();
    this.initializeEffects();

    // Set initial default period
    this.selectedTime.update(t => ({ ...t, period: this.persianDateTimePickerService.englishLocale.am }));
  }

  private initializeEffects(): void {
    // Sync Lang/Period
    effect(() => {
      // Just triggering computed dependency
      const l = this.effectiveLang();
      // If language changes, we might want to update period text in selectedTime if it matches AM/PM?
      // Original code reset period on lang change:
      // this.selectedTime.period = this.lang.am;
      // this.periods = [this.lang.am, this.lang.pm];
      const currentPeriod = this.selectedTime().period;
      // Logic to update period text if it was default?
      // For simplicity, we stick closer to original behavior but maybe only if uninitialized or mismatch?
    });

    // Sync input 'value'
    effect(() => {
      const val = this.valueInput();
      if (val !== null && val !== undefined) {
        this.writeValue(val);
      }
    });

    // Sync 'selectedDate'
    effect(() => {
      const d = this.selectedDateInput();
      if (d) {
        this._selectedDate = d;
        // updateFromValue calls updateFromDate using value but _selectedDate is used as base
        this.updateFromValue(this._value);
      }
    });

    effect(() => {
      // displayFormat change logic handled by computed
      this.updateTimeDisplay();
    });

    effect(() => {
      // Auto-open for inline mode
      if (this.inline()) {
        this.isOpen.set(true);
        // Using setTimeout to allow view to render before scrolling
        setTimeout(() => this.scrollToTime(), 0);
      }
    });

    // Manage document click listener based on inline mode
    effect(() => {
      const isInline = this.inline();
      if (!isInline) {
        document.addEventListener('click', this.handleDocumentClick);
      } else {
        document.removeEventListener('click', this.handleDocumentClick);
      }
    });
  }

  ngOnInit(): void {
    runInInjectionContext(this.injector, () => {
      this.origin = new CdkOverlayOrigin(this.elementRef);
    });
    this.setupInputSubscription();

    // Initialize with selectedDate
    // this.value = this.selectedDate; -> handled by effect on selectedDateInput if provided?
    // But _selectedDate is initialized to new Date().
    this.writeValue(this._selectedDate);
  }

  ngOnDestroy(): void {
    this.cleanupTimeouts();
    // Clean up document click listener
    document.removeEventListener('click', this.handleDocumentClick);
  }

  // Initialization methods
  initializeForm(): void {
    this.form = this.formBuilder.group({
      timeInput: ['']
    });
  }

  setupInputSubscription(): void {
    this.form!.get('timeInput')?.valueChanges.subscribe(value => {
      if (!value) return;

      if (!this.isOpen()) {
        this.validateAndUpdateTime(value);
      } else {
        this.parseTimeString(value);
        this.scrollToTime();
      }
    });
  }

  formatTime(date?: Date): string {
    const adapter = this.effectiveDateAdapter();
    if (!date && !adapter) return '';

    const currentDate = date || this.updateDateFromSelection();
    return adapter.format(currentDate, this.displayFormat());
  }

  parseTimeString(value: string | Date): void {
    const adapter = this.effectiveDateAdapter();
    if (!adapter) return;

    const date = value instanceof Date ? value : adapter.parse(value, this.displayFormat());
    if (!date) return;

    const hours = adapter.getHours(date);
    const minutes = adapter.getMinutes(date);
    const seconds = adapter.getSeconds(date);

    if (hours === null || minutes === null || seconds === null) return;

    const lang = this.effectiveLang();
    this.selectedTime.set({
      hour: hours,
      minute: minutes,
      second: seconds,
      period: hours >= 12 ? lang.pm : lang.am
    });

    this.changeDetectorRef.markForCheck();
  }

  updateFromValue(value: Date | string | null): void {
    if (!value) {
      this.resetSelection();
      return;
    }

    if (value instanceof Date) {
      this.updateFromDate(value);
    } else {
      this.parseTimeString(value);
    }
  }

  updateFromDate(date: Date | null): void {
    const adapter = this.effectiveDateAdapter();
    if (date && !isNaN(date.getTime()) && adapter) {
      const hours = adapter.getHours(date);
      if (hours === null) return;

      const lang = this.effectiveLang();
      this.selectedTime.set({
        hour: hours,
        minute: adapter.getMinutes(date) ?? 0,
        second: adapter.getSeconds(date) ?? 0,
        period: hours >= 12 ? lang.pm : lang.am
      });
    } else {
      this.resetSelection();
    }

    this.changeDetectorRef.markForCheck();
  }

  resetSelection(): void {
    const lang = this.effectiveLang();
    this.selectedTime.set({
      hour: 0,
      minute: 0,
      second: 0,
      period: lang.am
    });
    this.changeDetectorRef.markForCheck();
  }

  writeValue(value: Date | string | null): void {
    if (!value) {
      this._value = null;
      return;
    }

    if (value instanceof Date) {
      this._value = value;
    } else if (typeof value === 'string' && value.trim()) {
      const date = this._selectedDate;
      this._value = !isNaN(date!.getTime()) && this.valueType() === 'date' ? date : value;
      this.parseTimeString(value);
    }

    this.updateTimeDisplay();
    this.save(false);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // UI Event handlers
  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab' || event.key === 'Enter') {
      this.handleTimeInput();
      if (event.key === 'Tab') this.close();
    } else if (event.key === 'Escape') {
      this.close();
    }
  }

  handleTimeInput(): void {
    const currentValue = this.form!.get('timeInput')?.value;
    if (currentValue || (!currentValue && !this.allowEmpty())) {
      this.validateAndUpdateTime(currentValue);
    }
  }

  handleDocumentClick = (event: MouseEvent): void => {
    if (!this.elementRef.nativeElement.contains(event.target) && this.isOpen()) {
      this.close();
      this.handleTimeInput();
    }
  };

  onFocusInput(): void {
    if (!this.isOpen()) {
      this.open();
    }
  }

  toggleTimePicker(event: Event): void {
    event.stopPropagation();
    this.isOpen() ? this.close() : this.open();
  }

  // Picker operations
  open(): void {
    if (this.inline() || this.disabled() || this.readOnly()) return;

    const wasOpen = this.isOpen();
    this.isOpen.set(true);
    this.openChange.emit(true);
    this.scrollToTime();

    if (!wasOpen) {
      this.changeDetectorRef.markForCheck();
    }
  }

  close(): void {
    if (this.inline()) return;

    this.cleanupTimeouts();
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.openChange.emit(false);
      this.changeDetectorRef.markForCheck();
    }
  }

  // Selection methods
  selectHour(hour: number): void {
    if (!this.isHourDisabled(hour)) {
      this.selectedTime.update(t => ({ ...t, hour }));
      this.updateTimeDisplay();
      this.scrollToSelectedItem(`h${hour}`);
      if (this.inline()) this.save(false);
    }
  }

  selectMinute(minute: number): void {
    if (!this.isMinuteDisabled(minute)) {
      this.selectedTime.update(t => ({ ...t, minute }));
      this.updateTimeDisplay();
      this.scrollToSelectedItem(`m${minute}`);
      if (this.inline()) this.save(false);
    }
  }

  selectSecond(second: number): void {
    if (!this.isSecondDisabled(second)) {
      this.selectedTime.update(t => ({ ...t, second }));
      this.updateTimeDisplay();
      this.scrollToSelectedItem(`s${second}`);
      if (this.inline()) this.save();
    }
  }

  selectPeriod(period: string): void {
    this.selectedTime.update(t => ({ ...t, period }));
    this.updateTimeDisplay();
  }

  selectNow(): void {
    const now = this._selectedDate;
    const lang = this.effectiveLang();
    this.selectedTime.set({
      hour: now!.getHours(),
      minute: now!.getMinutes(),
      second: now!.getSeconds(),
      period: now!.getHours() >= 12 ? lang.pm : lang.am
    });

    this.updateTimeDisplay();
    this.scrollToTime();
    this.save(false);
  }

  save(close = true): void {
    const date = this.updateDateFromSelection();
    const {
      isValid,
      normalizedDate
    } = this.validateAndNormalizeTime(date);

    if (!isValid || !normalizedDate) return;

    const outputValue = this.valueType() === 'date'
      ? normalizedDate
      : this.formatTime(normalizedDate);

    // deep comparison or simple check
    const valueChanged = JSON.stringify(this._value) !== JSON.stringify(outputValue);
    if (valueChanged) {
      this._value = outputValue;
      this.form!.get('timeInput')?.setValue(this.formatTime(normalizedDate), { emitEvent: false });

      this.onChange(outputValue);
      this.timeChange.emit(outputValue);
      this.changeDetectorRef.markForCheck();
    }

    if (close && !this.inline()) {
      this.close();
    }
  }

  // Validation methods
  validateAndUpdateTime(value: string): void {
    const adapter = this.effectiveDateAdapter();
    if (!value || !adapter) {
      this.updateTimeDisplay();
      return;
    }

    try {
      const parsedDate = adapter.parse(value, this.displayFormat());
      if (!parsedDate) {
        this.updateTimeDisplay();
        return;
      }

      const {
        isValid,
        normalizedDate
      } = this.validateAndNormalizeTime(parsedDate);
      const formattedTime = adapter.format(normalizedDate!, this.displayFormat());
      this.form!.get('timeInput')?.setValue(formattedTime, { emitEvent: false });
      this.parseTimeString(normalizedDate!);

      const outputValue = this.valueType() === 'date' ? normalizedDate : formattedTime;
      this._value = outputValue;
      this.onChange(outputValue);
      this.timeChange.emit(outputValue!);

    } catch (error) {
      console.error('Error normalizing time:', error);
      this.updateTimeDisplay();
    }
  }

  isHourDisabled(hour: number): boolean {
    const adapter = this.effectiveDateAdapter();
    if (!adapter) return false;
    return this.isFullHourDisabled(hour);
  }

  isMinuteDisabled(minute: number): boolean {
    const adapter = this.effectiveDateAdapter();
    if (!adapter) return false;
    return this.isFullMinuteDisabled(minute);
  }

  isSecondDisabled(second: number): boolean {
    const adapter = this.effectiveDateAdapter();
    if (!adapter) return false;
    const testConfig = {
      ...this.selectedTime(),
      second
    };
    const testDate = this.createDateWithTime(testConfig);
    return this.isTimeDisabled(testDate);
  }

  isTimeDisabled(testDate: Date): boolean {
    const adapter = this.effectiveDateAdapter();
    if (!adapter) return false;

    if (this.minTime()) {
      const minDate = adapter.parse(this.minTime()!, this.displayFormat());
      if (minDate && adapter.isBefore(testDate, minDate)) {
        return true;
      }
    }

    if (this.maxTime()) {
      const maxDate = adapter.parse(this.maxTime()!, this.displayFormat());
      if (maxDate && adapter.isAfter(testDate, maxDate)) {
        return true;
      }
    }

    return this.disabledTimesFilter() ? this.disabledTimesFilter()!(testDate) : false;
  }

  validateAndNormalizeTime(date: Date): { isValid: boolean; normalizedDate: Date | null } {
    const adapter = this.effectiveDateAdapter();
    if (!adapter) {
      return {
        isValid: false,
        normalizedDate: null
      };
    }

    let isValid = true;
    // Clone the date to avoid modifying the original
    let normalizedDate = adapter.clone(date);
    if (this.isTimeDisabled(normalizedDate)) {
      isValid = false;
      // Try to find nearest valid time (check next and previous 48 intervals of 30 minutes)
      for (let i = 1; i <= 48; i++) {
        const nextTime = adapter.addMinutes(date, i * 30);
        const prevTime = adapter.addMinutes(date, -i * 30);

        if (!this.isTimeDisabled(nextTime)) {
          normalizedDate = nextTime;
          break;
        }
        if (!this.isTimeDisabled(prevTime)) {
          normalizedDate = prevTime;
          break;
        }
      }

      // If still disabled after trying to find valid time
      if (this.isTimeDisabled(normalizedDate)) {
        return {
          isValid: false,
          normalizedDate: null
        };
      }
    }

    return {
      isValid: isValid,
      normalizedDate
    };
  }

  updateDateFromSelection(): Date {
    const adapter = this.effectiveDateAdapter();
    if (!adapter) return this._selectedDate!;

    const time = this.selectedTime();
    let hours = time.hour;
    const lang = this.effectiveLang();

    if (this.timeFormat() === '12') {
      if (time.period === lang.pm && hours < 12) hours += 12;
      if (time.period === lang.am && hours === 12) hours = 0;
    }

    let date = this._value instanceof Date ?
      adapter.clone(this._value) :
      this._selectedDate;

    // Only update time components of the date
    date = adapter.setHours(date!, hours);
    date = adapter.setMinutes(date!, time.minute);
    date = adapter.setSeconds(date!, time.second);

    return date;
  }

  async scrollToTime() {
    await this.scrollToSelectedItem(`h${this.selectedTime().hour}`, 'auto');
    await this.scrollToSelectedItem(`m${this.selectedTime().minute}`, 'auto');
    if (this.showSeconds()) {
      await this.scrollToSelectedItem(`s${this.selectedTime().second}`, 'auto');
    }
  }

  scrollToSelectedItem(id: string, behavior: ScrollBehavior = 'smooth'): Promise<boolean> {
    this.cleanupTimeouts();
    return new Promise((resolve) => {
      if (!id) {
        resolve(false);
        return;
      }

      this.timeoutId = window.setTimeout(() => {
        const wrapper = this.popupWrapper()?.nativeElement;
        const selectedElement = wrapper?.querySelector(`#selector_${id}`);
        if (selectedElement) {
          selectedElement.scrollIntoView({
            behavior,
            block: 'center'
          });
        }
        resolve(true);
      }, 0);
    });
  }

  cleanupTimeouts(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  onPositionChange(position: ConnectedOverlayPositionChange): void {
    this.changeDetectorRef.detectChanges();
  }

  updateTimeDisplay(): void {
    const formatted = this.formatTime();
    this.form!.get('timeInput')?.setValue(formatted, { emitEvent: false });
    this.changeDetectorRef.markForCheck();
  }

  createDateWithTime(config: TimeConfig): Date {
    const adapter = this.effectiveDateAdapter();
    // Use _selectedDate or new Date() as base
    let date = this._selectedDate ? adapter.clone(this._selectedDate) : new Date();

    let hour = config.hour;
    const lang = this.effectiveLang();
    if (this.timeFormat() === '12') {
      if (config.period === lang.pm && hour < 12) hour += 12;
      if (config.period === lang.am && hour === 12) hour = 0;
    }

    date = adapter.setHours(date, hour);
    date = adapter.setMinutes(date, config.minute);
    date = adapter.setSeconds(date, config.second);
    return date;
  }

  private onChange: (value: any) => void = () => {
  };

  private onTouched: () => void = () => {
  };

  private isFullHourDisabled(hour: number): boolean {
    for (let minute = 0; minute < 60; minute++) {
      const testConfig = {
        ...this.selectedTime(),
        hour,
        minute,
        second: 0
      };
      const testDate = this.createDateWithTime(testConfig);

      if (!this.isTimeDisabled(testDate)) {
        return false; // If any minute is enabled, hour is not fully disabled
      }
    }
    return true; // All minutes in hour are disabled
  }

  private isFullMinuteDisabled(minute: number): boolean {
    if (!this.showSeconds()) {
      const testConfig = {
        ...this.selectedTime(),
        minute,
        second: 0
      };
      const testDate = this.createDateWithTime(testConfig);
      return this.isTimeDisabled(testDate);
    }

    // If showing seconds, check each second
    for (let second = 0; second < 60; second++) {
      const testConfig = {
        ...this.selectedTime(),
        minute,
        second
      };
      const testDate = this.createDateWithTime(testConfig);

      if (!this.isTimeDisabled(testDate)) {
        return false; // If any second is enabled, minute is not fully disabled
      }
    }
    return true; // All seconds in minute are disabled
  }
}
