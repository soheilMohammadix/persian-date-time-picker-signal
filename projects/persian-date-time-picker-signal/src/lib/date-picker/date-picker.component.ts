import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  forwardRef,
  Inject,
  inject,
  Injector,
  input,
  NgZone,
  OnDestroy,
  OnInit,
  output,
  runInInjectionContext,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {BreakpointObserver} from "@angular/cdk/layout";
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
} from "@angular/forms";
import {slideMotion, slideUpMotion} from "../utils/animation/slide";
import {DateAdapter, GregorianDateAdapter, JalaliDateAdapter,} from "../date-adapter";
import {CustomLabels, DateRange, LanguageLocale, RangeInputLabels,} from "../utils/models";
import {DatePickerPopupComponent} from "../date-picker-popup/date-picker-popup.component";
import {
  CdkOverlayOrigin,
  ConnectedOverlayPositionChange,
  ConnectionPositionPair,
  HorizontalConnectionPos,
  OverlayModule,
  VerticalConnectionPos,
} from "@angular/cdk/overlay";
import {
  DATE_PICKER_POSITION_MAP,
  DEFAULT_DATE_PICKER_POSITIONS,
  NzConnectedOverlayDirective,
} from "../utils/overlay/overlay";
import {DOCUMENT, NgTemplateOutlet} from "@angular/common";
import {DestroyService, PersianDateTimePickerService,} from "../persian-date-time-picker.service";
import {fromEvent, map, Subscription, takeUntil} from "rxjs";
import {CalendarType, DatePickerMode, Placement, RangePartType, ValueFormat,} from "../utils/types";
import {CustomTemplate} from "../utils/template.directive";
import {DateMaskDirective} from "../utils/input-mask.directive";

@Component({
  selector: "persian-date-picker",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  templateUrl: "./date-picker.component.html",
  styleUrls: ["./date-picker.component.scss"],
  host: {
    "[class.persian-date-picker]": "true",
    "[class.persian-date-picker-rtl]": "rtl()",
  },
  imports: [
    FormsModule,
    ReactiveFormsModule,
    OverlayModule,
    NgTemplateOutlet,
    NzConnectedOverlayDirective,
    DateMaskDirective,
    DatePickerPopupComponent
  ],
  providers: [
    DestroyService,
    PersianDateTimePickerService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  animations: [slideMotion, slideUpMotion],
})
export class DatePickerComponent
  implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy {
  // ========== Input Signals ==========
  rtl = input(false);
  mode = input<DatePickerMode>("day");
  isRange = input(false);
  customLabels = input<Array<CustomLabels>>([]);
  calendarType = input<CalendarType>("gregorian");
  lang = input<LanguageLocale | undefined>(undefined);
  cssClass = input("");
  footerDescription = input("");
  rangeInputLabels = input<RangeInputLabels | undefined>(undefined);
  inputLabel = input<string | undefined>(undefined);
  placement = input<Placement>("bottomRight");
  disabled = input(false);
  isInline = input(false);
  showSidebar = input(true);
  showToday = input(false);
  valueFormat = input<ValueFormat>("gregorian");
  disableInputMask = input(false);
  disabledDates = input<Array<Date | string>>([]);
  disabledDatesFilter = input<((date: Date) => boolean) | undefined>(undefined);
  disabledTimesFilter = input<((date: Date) => boolean) | undefined>(undefined);
  allowEmpty = input(false);
  readOnly = input(false);
  readOnlyInput = input(false);
  minDate = input<Date | string | null>(null);
  maxDate = input<Date | string | null>(null);
  format = input("yyyy/MM/dd");

  // ========== Output Signals ==========
  onFocus = output<any>();
  onBlur = output<any>();
  onChangeValue = output<any>();
  onOpenChange = output<boolean>();

  // ========== Queries ==========
  datePickerInput = viewChild<ElementRef>("datePickerInput");
  rangePickerInputs =
    viewChildren<ElementRef<HTMLInputElement>>("rangePickerInput");
  datePickerPopup = viewChild(DatePickerPopupComponent);
  templates = contentChildren(CustomTemplate);

  // ========== Class Properties ==========
  origin?: CdkOverlayOrigin;
  overlayPositions: ConnectionPositionPair[] = [
    ...DEFAULT_DATE_PICKER_POSITIONS,
  ];
  currentPositionX: HorizontalConnectionPos = "start";
  currentPositionY: VerticalConnectionPos = "bottom";
  document?: Document;

  // State Signals
  isOpen = signal(false);
  selectedDate = signal<Date | null>(null);
  selectedStartDate = signal<Date | null>(null);
  selectedEndDate = signal<Date | null>(null);
  activeInput = signal<"start" | "end" | "" | null>("");

  dateAdapterSignal = computed<DateAdapter<Date>>(() => this.calendarType() === 'jalali' ? this.jalaliDateAdapter : this.gregorianDateAdapter);

  form?: FormGroup;
  hideStateHelper = false;
  isInternalChange = false;
  lastEmittedValue: any = null;

  showTimePicker = computed(() => this.hasTimeComponent(this.format()))
  timeDisplayFormat = computed(() => this.extractTimeFormat(this.format()))

  documentClickListener?: (event: MouseEvent) => void;

  private formSubscriptions: Subscription[] = [];


  private breakpointObserver = inject(BreakpointObserver);
  isMobile = toSignal(
    this.breakpointObserver
      .observe("(max-width: 599.98px)")
      .pipe(map((result) => result.matches)),
    {initialValue: false},
  );

  parsedMinDate = computed(() => {
    const min = this.minDate();
    if (!min) return null;
    const adapter = this.dateAdapterSignal();
    if (!adapter) return null;
    const valueAdapter =
      this.valueFormat() === "jalali"
        ? this.jalaliDateAdapter
        : this.gregorianDateAdapter;
    return (
      valueAdapter?.parse(min, this.extractDateFormat(this.format())) || null
    );
  });

  parsedMaxDate = computed(() => {
    const max = this.maxDate();
    if (!max) return null;
    const adapter = this.dateAdapterSignal();
    if (!adapter) return null;
    const valueAdapter =
      this.valueFormat() === "jalali"
        ? this.jalaliDateAdapter
        : this.gregorianDateAdapter;
    return (
      valueAdapter?.parse(max, this.extractDateFormat(this.format())) || null
    );
  });

  displayValue = computed(() => {
    const adapter = this.dateAdapterSignal();
    if (!adapter) return "";

    if (this.isRange()) {
      const start = this.selectedStartDate();
      const end = this.selectedEndDate();
      if (start && end) {
        return `${adapter.format(start, this.format())} - ${adapter.format(end, this.format())}`;
      }
      return start ? adapter.format(start, this.format()) : "";
    } else {
      const date = this.selectedDate();
      return date ? adapter.format(date, this.format()) : "";
    }
  });

  effectiveLang = computed(() => {
    const lang = this.lang();
    if (lang) return lang;
    return this.calendarType() === "jalali"
      ? this.persianDateTimePickerService.persianLocale
      : this.persianDateTimePickerService.englishLocale;
  });

  get dateAdapter(): DateAdapter<Date> | null {
    return this.dateAdapterSignal();
  }

  get valueAdapter() {
    return this.valueFormat() === "jalali"
      ? this.jalaliDateAdapter
      : this.gregorianDateAdapter;
  }

  constructor(
    public formBuilder: FormBuilder,
    public elementRef: ElementRef,
    public injector: Injector,
    public changeDetectorRef: ChangeDetectorRef,
    public persianDateTimePickerService: PersianDateTimePickerService,
    public destroyService: DestroyService,
    public ngZone: NgZone,
    public jalaliDateAdapter: JalaliDateAdapter,
    public gregorianDateAdapter: GregorianDateAdapter,
    @Inject(DOCUMENT) doc: Document,
  ) {
    this.initializeComponent(doc);
    this.initializeEffects();
  }

  private initializeEffects(): void {

    // Language Effect
    effect(() => {
      const lang = this.effectiveLang();
      untracked(() => {
        this.persianDateTimePickerService.setLanguageLocale(lang);
      });
    });


    // Placement Effect - initialize placement based on input
    effect(() => {
      const placement = this.placement();
      const rtl = this.rtl(); // Track rtl changes too
      // Run synchronously, not untracked, to ensure proper initialization
      this.setPlacement(placement);
    });

    // Range Mode Effect - Setup origin based on range mode
    effect(() => {
      const isRange = this.isRange();
      untracked(() => {
        // Initialize origin - for non-range, use elementRef; for range, it will be updated when input is focused
        if (!isRange) {
          runInInjectionContext(this.injector, () => {
            this.origin = new CdkOverlayOrigin(this.elementRef);
          });
        }
        // For range mode, origin will be set when toggleDatePicker is called
      });
    });

    // Calendar Type change - update input values
    effect(() => {
      const adapter = this.dateAdapterSignal();
      if (adapter) {
        untracked(() => {
          this.updateInputValue();
        });
      }
    });
  }

  ngOnInit(): void {
    this.initialize();
    document.addEventListener("click", this.documentClickListener!);
  }

  ngAfterViewInit(): void {
    this.setupAfterViewInit();
    this.changeDetectorRef.markForCheck();
  }

  ngOnDestroy(): void {
    this.destroyService.next();
    this.destroyService.complete();
    document.removeEventListener("click", this.documentClickListener!);
    this.cleanupFormSubscriptions();
  }

  // ========== Initialization Methods ==========
  initializeComponent(doc: Document): void {
    this.origin = new CdkOverlayOrigin(this.elementRef);
    this.document = doc;
    this.form = this.formBuilder.group({
      dateInput: [""],
      startDateInput: [""],
      endDateInput: [""],
    });
    this.documentClickListener = this.handleDocumentClick.bind(this);
    // Initialize placement immediately
    this.setPlacement(this.placement());
  }

  initialize(): void {
    this.setupFormControls();
  }

  setupAfterViewInit(): void {
    this.setupActiveInputSubscription();
    this.setupMouseDownEventHandler();
  }

  private cleanupFormSubscriptions(): void {
    this.formSubscriptions.forEach((sub) => sub.unsubscribe());
    this.formSubscriptions = [];
  }

  setupFormControls(): void {
    this.cleanupFormSubscriptions();

    if (this.isRange()) {
      const startSub = this.form!.get("startDateInput")
        ?.valueChanges.pipe(takeUntil(this.destroyService))
        .subscribe((value) => this.onInputChange(value, "start"));

      const endSub = this.form!.get("endDateInput")
        ?.valueChanges.pipe(takeUntil(this.destroyService))
        .subscribe((value) => this.onInputChange(value, "end"));

      if (startSub) this.formSubscriptions.push(startSub);
      if (endSub) this.formSubscriptions.push(endSub);
    } else {
      const dateSub = this.form!.get("dateInput")
        ?.valueChanges.pipe(takeUntil(this.destroyService))
        .subscribe((value) => this.onInputChange(value));

      if (dateSub) this.formSubscriptions.push(dateSub);
    }
  }

  handleDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isOpen()) {
        this.close();
        this.onInputBlur(this.activeInput() as any, event as any);
      }
      this.hideStateHelper = false;
    }
  }

  onInputChange(value: string, inputType?: "start" | "end"): void {
    if (!this.isInternalChange && this.dateAdapter) {
      if (this.isRange()) {
        this.handleRangeInputChange(value, inputType);
      } else {
        this.handleSingleInputChange(value);
      }
      this.updateDatePickerPopup();
    }
  }

  handleRangeInputChange(value: string, inputType?: "start" | "end"): void {
    const date = this.dateAdapter!.parse(value, this.format());
    if (date) {
      if (inputType === "start") {
        this.selectedStartDate.set(this.clampDate(date));
      } else if (inputType === "end") {
        this.selectedEndDate.set(this.clampDate(date));
      }
      this.emitValueIfChanged();
    }
  }

  handleSingleInputChange(value: string): void {
    const date = this.dateAdapter!.parse(value, this.format());
    if (date) {
      this.selectedDate.set(this.clampDate(date));
      this.emitValueIfChanged();
    }
  }

  emitValueIfChanged(): void {
    const newValue = this.prepareValueForEmission();
    if (
      newValue &&
      JSON.stringify(newValue) !== JSON.stringify(this.lastEmittedValue)
    ) {
      this.lastEmittedValue = newValue;
      this.onChange(newValue);
      this.onChangeValue.emit(newValue);
    }
  }

  prepareValueForEmission(): any {
    if (this.isRange()) {
      const start = this.selectedStartDate();
      const end = this.selectedEndDate();
      if (start && end) {
        return {
          start: this.convertDateToFormat(start, this.calendarType()),
          end: this.convertDateToFormat(end, this.calendarType()),
        };
      }
    } else if (this.selectedDate()) {
      return this.convertDateToFormat(
        this.selectedDate()!,
        this.calendarType(),
      );
    }
    return null;
  }

  onDateSelected(date: Date): void {
    const clampedDate = this.clampDate(date);
    if (this.isRange()) {
      this.handleRangeDateSelection(clampedDate!);
    } else {
      this.handleSingleDateSelection(clampedDate!);
    }
    this.hideStateHelper = true;
    this.updateDatePickerPopup();
    this.focus();
  }

  handleRangeDateSelection(date: Date): void {
    const start = this.selectedStartDate();
    const end = this.selectedEndDate();

    if (!start || (start && end) || this.dateAdapter!.isBefore(date, start)) {
      this.selectedStartDate.set(date);
      this.selectedEndDate.set(null);
      this.isInternalChange = true;
      this.form!.get("startDateInput")?.setValue(
        this.dateAdapter!.format(date, this.format()),
        {emitEvent: false},
      );
      this.form!.get("endDateInput")?.setValue("", {emitEvent: false});
      this.isInternalChange = false;
    } else {
      this.selectedEndDate.set(date);
      this.isInternalChange = true;
      this.form!.get("endDateInput")?.setValue(
        this.dateAdapter!.format(date, this.format()),
        {emitEvent: false},
      );
      this.isInternalChange = false;
      this.emitValueIfChanged();
      this.close();
    }
    this.changeDetectorRef.markForCheck();
  }

  handleSingleDateSelection(date: Date): void {
    this.selectedDate.set(date);
    const formattedDate = this.dateAdapter!.format(date, this.format());
    this.isInternalChange = true;
    this.form!.get("dateInput")?.setValue(formattedDate, {emitEvent: false});
    this.isInternalChange = false;
    this.emitValueIfChanged();
    // Only close popup when time picker is not shown
    if (!this.showTimePicker()) {
      this.close();
    }
  }

  onDateRangeSelected(dateRange: DateRange): void {
    this.hideStateHelper = true;

    const start = this.clampDate(<Date>dateRange.start);
    this.selectedStartDate.set(start);
    const startFormatted = this.dateAdapter!.format(start!, this.format());
    this.isInternalChange = true;
    this.form!.get("startDateInput")?.setValue(startFormatted, {
      emitEvent: false,
    });

    if (dateRange.end) {
      const end = this.clampDate(<Date>dateRange.end);
      this.selectedEndDate.set(end);
      const endFormatted = this.dateAdapter!.format(end!, this.format());
      this.form!.get("endDateInput")?.setValue(endFormatted, {
        emitEvent: false,
      });
      this.isInternalChange = false;
      this.emitValueIfChanged();
      if (!this.showTimePicker()) this.close();
      this.updateDatePickerPopup();
      this.focus();
    } else {
      this.isInternalChange = false;
    }
  }

  close(): void {
    if (this.isInline()) {
      return;
    }
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.onOpenChange.emit(false);
    }
  }

  open(): void {
    if (
      this.isInline() ||
      this.isOpen() ||
      this.disabled() ||
      this.readOnly()
    ) {
      return;
    }
    this.isOpen.set(true);
    this.onOpenChange.emit(true);
    this.focus();
    this.changeDetectorRef.markForCheck();
  }

  focus(): void {
    const activeInputElement = this.getInput(this.activeInput() || undefined);
    if (this.document!.activeElement !== activeInputElement) {
      activeInputElement?.focus();
      const length = activeInputElement?.value?.length;
      activeInputElement?.setSelectionRange(length!, length!);
    }
  }

  getInput(partType?: RangePartType): HTMLInputElement | undefined {
    if (this.isInline()) {
      return undefined;
    }
    const rangeInputsArray = this.rangePickerInputs();
    return this.isRange()
      ? partType === "start"
        ? rangeInputsArray[0]?.nativeElement
        : rangeInputsArray[rangeInputsArray.length - 1]?.nativeElement
      : this.datePickerInput()?.nativeElement;
  }

  getPlaceholder(inputType: string | null = null): string {
    const lang = this.effectiveLang();
    if (inputType === "start") return lang.startDate;
    if (inputType === "end") return lang.endDate;

    switch (this.mode()) {
      case "month":
        return lang.selectMonth;
      case "year":
        return lang.selectYear;
      default:
        return lang.selectDate;
    }
  }

  clampDate(date: Date): Date | null {
    if (!date || !this.dateAdapter) return date;

    let adjustedDate: Date | null = this.dateAdapter.clone(date);

    const minDate = this.parsedMinDate();
    const maxDate = this.parsedMaxDate();

    if (minDate && this.dateAdapter.isBefore(adjustedDate, minDate)) {
      return minDate;
    }
    if (maxDate && this.dateAdapter.isAfter(adjustedDate, maxDate)) {
      return maxDate;
    }

    if (this.isDateDisabled(adjustedDate)) {
      adjustedDate = this.findNearestValidDate(adjustedDate);
    }

    adjustedDate = this.clampDateTime(adjustedDate, date);

    return adjustedDate;
  }

  clampDateTime(adjustedDate: Date | null, date: Date) {
    if (!adjustedDate || !this.dateAdapter) return adjustedDate;

    if (this.hasTimeComponent(this.format())) {
      adjustedDate.setHours(date.getHours());
      adjustedDate.setMinutes(date.getMinutes());
      adjustedDate.setSeconds(date.getSeconds());
      let {normalizedDate} = this.validateAndNormalizeTime(adjustedDate);
      adjustedDate = normalizedDate;
    }
    return adjustedDate;
  }

  findNearestValidDate(date: Date): Date {
    if (!this.dateAdapter) return date;

    let nextDate = this.dateAdapter.addDays(date, 1);
    let prevDate = this.dateAdapter.addDays(date, -1);

    while (this.isDateDisabled(nextDate) && this.isDateDisabled(prevDate)) {
      nextDate = this.dateAdapter.addDays(nextDate, 1);
      prevDate = this.dateAdapter.addDays(prevDate, -1);
    }

    if (!this.isDateDisabled(nextDate)) {
      date = nextDate;
    } else if (!this.isDateDisabled(prevDate)) {
      date = prevDate;
    }
    return date;
  }

  validateAndNormalizeTime(date: Date): {
    isValid: boolean;
    normalizedDate: Date | null;
  } {
    if (!this.dateAdapter) {
      return {
        isValid: false,
        normalizedDate: null,
      };
    }

    let isValid = true;
    let normalizedDate = this.dateAdapter.clone(date);

    if (this.isTimeDisabled(normalizedDate)) {
      isValid = false;
      const startOfDay = this.dateAdapter.clone(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = this.dateAdapter.clone(date);
      endOfDay.setHours(23, 59, 59, 999);

      const currentMinutes = date.getHours() * 60 + date.getMinutes();
      const maxForwardMinutes = 24 * 60 - currentMinutes;
      let validTimeFound = false;

      for (let i = 1; i <= maxForwardMinutes; i++) {
        const nextTime = this.dateAdapter.clone(date);
        nextTime.setHours(
          Math.floor((currentMinutes + i) / 60),
          (currentMinutes + i) % 60,
          0,
        );
        if (
          nextTime.getTime() <= endOfDay.getTime() &&
          !this.isTimeDisabled(nextTime)
        ) {
          normalizedDate = nextTime;
          validTimeFound = true;
          break;
        }
      }

      if (!validTimeFound)
        for (let i = 1; i < currentMinutes; i++) {
          const prevTime = this.dateAdapter.clone(date);
          prevTime.setHours(
            Math.floor((currentMinutes - i) / 60),
            (currentMinutes - i) % 60,
            0,
          );
          if (
            prevTime.getTime() >= startOfDay.getTime() &&
            !this.isTimeDisabled(prevTime)
          ) {
            normalizedDate = prevTime;
            break;
          }
        }

      if (this.isTimeDisabled(normalizedDate)) {
        normalizedDate = startOfDay;
      }
    }

    return {
      isValid: isValid,
      normalizedDate,
    };
  }

  parseDisabledDates(): Date[] {
    if (!this.dateAdapter) return [];

    return this.disabledDates()
      .map((date) => {
        if (date instanceof Date) {
          return this.dateAdapter!.startOfDay(date);
        }
        const parsedDate = this.dateAdapter!.parse(
          date,
          this.extractDateFormat(this.format()),
        );
        return parsedDate || null;
      })
      .filter((date) => date !== null) as Date[];
  }

  isDateDisabled(date: Date): boolean {
    if (!date || !this.dateAdapter) return false;

    const dateToCheck = this.dateAdapter.startOfDay(date);
    const parsedDisabledDates = this.parseDisabledDates();
    const isDisabledDate = parsedDisabledDates.some((disabledDate) =>
      this.dateAdapter!.isSameDay(dateToCheck, disabledDate),
    );

    const filter = this.disabledDatesFilter();
    const isFilterDisabled = filter ? filter(dateToCheck) : false;

    return isDisabledDate || isFilterDisabled;
  }

  isTimeDisabled(date: Date): boolean {
    const filter = this.disabledTimesFilter();
    return filter ? filter(date) : false;
  }

  dateFormatValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || !this.dateAdapter) return null;

    const format = this.getFormatForMode();
    if (!this.dateAdapter.isValidFormat(value, format)) {
      return {invalidFormat: true};
    }
    return null;
  }

  getFormatForMode(): string {
    switch (this.mode()) {
      case "year":
        return "yyyy";
      case "month":
        return "yyyy/MM";
      default:
        return this.format();
    }
  }

  setPlacement(placement: Placement): void {
    let activePlacement = placement;
    // For RTL, we need to mirror the horizontal positions
    if (this.rtl()) {
      if (placement === "bottomLeft") activePlacement = "bottomRight";
      else if (placement === "bottomRight") activePlacement = "bottomLeft";
      else if (placement === "topLeft") activePlacement = "topRight";
      else if (placement === "topRight") activePlacement = "topLeft";
    }
    const position: ConnectionPositionPair =
      DATE_PICKER_POSITION_MAP[activePlacement];

    if (!position) {
      // Fallback to default if position not found
      this.overlayPositions = [...DEFAULT_DATE_PICKER_POSITIONS];
      this.currentPositionX = "start";
      this.currentPositionY = "bottom";
      return;
    }

    this.overlayPositions = [position, ...DEFAULT_DATE_PICKER_POSITIONS];
    this.currentPositionX = position.originX;
    this.currentPositionY = position.originY;
    this.changeDetectorRef.markForCheck();
  }

  onPositionChange(position: ConnectedOverlayPositionChange): void {
    if (
      this.currentPositionX !== position.connectionPair.originX ||
      this.currentPositionY !== position.connectionPair.originY
    ) {
      this.currentPositionX = position.connectionPair.originX;
      this.currentPositionY = position.connectionPair.originY;
      this.changeDetectorRef.markForCheck();
    }
  }

  onFocusout(event: FocusEvent): void {
    event.preventDefault();
    this.onTouch();
    const popup = this.datePickerPopup();
    if (
      !this.elementRef.nativeElement.contains(event.relatedTarget as Node) &&
      !popup?.elementRef.nativeElement.contains(event.relatedTarget as Node)
    ) {
      this.close();
    }
  }

  onInputBlur(inputType: "start" | "end" | null, event: Event): void {
    const inputValue = this.getInputValue(inputType);

    if (typeof inputValue === "string" && !this.isOpen()) {
      const correctedValue = this.validateAndCorrectInput(inputValue);
      if (correctedValue !== inputValue) {
        if (inputValue) {
          this.handleCorrectedValue(inputType, correctedValue);
        } else if (!this.allowEmpty()) {
          this.handleCorrectedValue(inputType, correctedValue);
        } else {
          this.selectedDate.set(null);
          this.onChange(inputValue);
        }
      }
      this.onBlur.emit({
        input: inputType,
        event,
        value: correctedValue,
      });
    }
  }

  getInputValue(inputType: "start" | "end" | null): string | undefined {
    if (this.isRange()) {
      return inputType === "start"
        ? this.form!.get("startDateInput")?.value
        : this.form!.get("endDateInput")?.value;
    }
    return this.form!.get("dateInput")?.value;
  }

  validateAndCorrectInput(value: string): string {
    if (!this.dateAdapter) return value;

    let date = this.dateAdapter.parse(value, this.format());
    if (!date) {
      const today = this.dateAdapter.today();
      date = this.clampDate(today);
    } else {
      date = this.clampDate(date);
    }
    return this.dateAdapter.format(date!, this.format());
  }

  handleCorrectedValue(
    inputType: "start" | "end" | null,
    correctedValue: string,
  ): void {
    this.isInternalChange = true;
    if (this.isRange()) {
      this.handleRangeCorrectedValue(inputType, correctedValue);
    } else {
      this.handleSingleCorrectedValue(correctedValue);
    }
    this.isInternalChange = false;
  }

  handleRangeCorrectedValue(
    inputType: "start" | "end" | null,
    correctedValue: string,
  ): void {
    if (!this.dateAdapter) return;

    if (inputType === "start") {
      this.form!.get("startDateInput")?.setValue(correctedValue);
      this.selectedStartDate.set(
        this.dateAdapter.parse(correctedValue, this.format()),
      );
    } else {
      this.form!.get("endDateInput")?.setValue(correctedValue);
      this.selectedEndDate.set(
        this.dateAdapter.parse(correctedValue, this.format()),
      );
    }

    if (this.selectedStartDate() && this.selectedEndDate()) {
      this.onChange({
        start: this.dateAdapter.format(
          this.selectedStartDate()!,
          this.format(),
        ),
        end: this.dateAdapter.format(this.selectedEndDate()!, this.format()),
      });
    }
    this.changeDetectorRef.markForCheck();
  }

  handleSingleCorrectedValue(correctedValue: string): void {
    if (!this.dateAdapter) return;

    this.form!.get("dateInput")?.setValue(correctedValue);
    this.selectedDate.set(
      this.dateAdapter.parse(correctedValue, this.format()),
    );
    this.onChange(this.selectedDate());
    this.changeDetectorRef.markForCheck();
  }

  onFocusInput(inputType: "start" | "end" | null, event: Event): void {
    // This method is no longer used - click handler is sufficient
    // Keeping for potential keyboard navigation support in the future
  }

  toggleDatePicker(inputType: "start" | "end" | "" | null, event: Event): void {
    event.stopPropagation();

    // Update active input
    this.activeInput.set(inputType);
    this.persianDateTimePickerService.setActiveInput(inputType || "");

    // Update origin based on which input was clicked
    this.updateOriginForActiveInput();

    // Emit focus event
    this.onFocus.emit({
      input: inputType,
      event,
    });

    // Open the picker
    this.open();

    // Force change detection to ensure overlay updates
    // this.changeDetectorRef.detectChanges();
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (
      (!event.shiftKey && event.key === "Tab") ||
      (!event.shiftKey && event.key === "Enter")
    ) {
      if (this.isRange()) {
        return;
      }
      this.close();
    }
  }

  updateInputValue(): void {
    if (!this.dateAdapter) return;

    this.isInternalChange = true;
    if (this.isRange()) {
      if (this.selectedStartDate()) {
        this.form!.get("startDateInput")?.setValue(
          this.dateAdapter.format(this.selectedStartDate()!, this.format()),
          {emitEvent: false},
        );
      }
      if (this.selectedEndDate()) {
        this.form!.get("endDateInput")?.setValue(
          this.dateAdapter.format(this.selectedEndDate()!, this.format()),
          {emitEvent: false},
        );
      }
    } else if (this.selectedDate()) {
      this.form!.get("dateInput")?.setValue(
        this.dateAdapter.format(this.selectedDate()!, this.format()),
        {emitEvent: false},
      );
    }
    this.isInternalChange = false;
  }

  updateDatePickerPopup(): void {
    this.changeDetectorRef.markForCheck();
  }

  convertDateToFormat(date: Date, fromType: CalendarType): any {
    if (!date) return null;

    switch (this.valueFormat()) {
      case "date":
        return date;
      case "jalali":
        return this.jalaliDateAdapter.format(date, this.format());
      case "gregorian":
        return this.gregorianDateAdapter.format(date, this.format());
      default:
        return this.dateAdapter?.format(date, this.format()) || null;
    }
  }

  // ========== ControlValueAccessor Implementation ==========
  onChange: any = () => {
  };
  onTouch: any = () => {
  };

  writeValue(value: any): void {
    if (!this.dateAdapter) {
      // Defer until adapter is ready
      setTimeout(() => this.writeValue(value), 0);
      return;
    }

    if (value) {
      this.isInternalChange = true;

      if (this.isRange() && typeof value === "object") {
        const startDate = this.parseIncomingValue(value.start);
        const endDate = this.parseIncomingValue(value.end);

        if (startDate) {
          this.selectedStartDate.set(startDate);
          this.form!.get("startDateInput")?.setValue(
            this.dateAdapter.format(startDate, this.format()),
            {emitEvent: false},
          );
        }

        if (endDate) {
          this.selectedEndDate.set(endDate);
          this.form!.get("endDateInput")?.setValue(
            this.dateAdapter.format(endDate, this.format()),
            {emitEvent: false},
          );
        }
      } else {
        const parsedDate = this.parseIncomingValue(value);
        if (parsedDate) {
          this.selectedDate.set(parsedDate);
          this.form!.get("dateInput")?.setValue(
            this.dateAdapter.format(parsedDate, this.format()),
            {emitEvent: false},
          );
        }
      }

      this.lastEmittedValue = value;
      this.isInternalChange = false;
      this.changeDetectorRef.markForCheck();
    } else {
      this.resetValues();
    }
  }

  resetValues(): void {
    this.isInternalChange = true;
    this.selectedDate.set(null);
    this.selectedStartDate.set(null);
    this.selectedEndDate.set(null);
    this.form!.get("dateInput")?.setValue("", {emitEvent: false});
    this.form!.get("startDateInput")?.setValue("", {emitEvent: false});
    this.form!.get("endDateInput")?.setValue("", {emitEvent: false});
    this.lastEmittedValue = null;
    this.isInternalChange = false;
    this.changeDetectorRef.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setupActiveInputSubscription(): void {
    this.persianDateTimePickerService.activeInput
      .pipe(takeUntil(this.destroyService))
      .subscribe((active: any) => {
        this.activeInput.set(active);
        if (active) {
          this.updateOriginForActiveInput();
          this.focus();
        }
      });
  }

  private updateOriginForActiveInput(): void {
    runInInjectionContext(this.injector, () => {
      // For single date picker, origin is always the main element
      if (!this.isRange()) {
        this.origin = new CdkOverlayOrigin(this.elementRef);
        return;
      }

      // For range picker, use the active input as origin
      const rangeInputsArray = this.rangePickerInputs();
      const active = this.activeInput();

      if (rangeInputsArray.length > 0) {
        const targetInput =
          active === "start"
            ? rangeInputsArray[0]
            : rangeInputsArray[rangeInputsArray.length - 1];

        if (targetInput) {
          this.origin = new CdkOverlayOrigin(targetInput);
        }
      } else {
        // Fallback to element ref if range inputs not available yet
        this.origin = new CdkOverlayOrigin(this.elementRef);
      }
    });
  }

  setupMouseDownEventHandler(): void {
    this.ngZone.runOutsideAngular(() =>
      fromEvent(this.elementRef.nativeElement, "mousedown")
        .pipe(takeUntil(this.destroyService))
        .subscribe((event: any) => {
          if (
            (event.target as HTMLInputElement).tagName.toLowerCase() !== "input"
          ) {
            event.preventDefault();
          }
        }),
    );
  }

  parseDateValue(value: any): Date | null {
    if (value instanceof Date) {
      return value;
    }
    return this.dateAdapter?.parse(value, this.format()) || null;
  }

  parseValueFromFormat(
    value: string | Date,
    targetAdapter: DateAdapter<Date>,
  ): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    return targetAdapter.parse(value, this.format());
  }

  parseIncomingValue(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;

    const parsedDate = this.valueAdapter.parse(value, this.format());
    if (parsedDate) return parsedDate;

    return null;
  }

  hasTimeComponent(format: string): boolean {
    return /[Hh]|[m]|[s]|[a]/g.test(format);
  }

  extractTimeFormat(format: string): string {
    const timeMatch = format.match(/[Hh]{1,2}:mm(?::ss)?(?:\s*[aA])?/);
    return timeMatch ? timeMatch[0] : "HH:mm";
  }

  extractDateFormat(format: string): string {
    const dateFormatMatch = format.match(/[yMd\/.-]+/);
    return dateFormatMatch ? dateFormatMatch[0] : "";
  }
}
