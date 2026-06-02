import {
    Directive,
    ChangeDetectorRef,
    ElementRef,
    HostListener,
    input,
    computed,
    signal,
    untracked,
    booleanAttribute,
    output,
    effect,
    TemplateRef,
    OnDestroy,
    OnInit,
    inject,
} from "@angular/core";
import { DateAdapter, GregorianDateAdapter, JalaliDateAdapter } from "./date-adapter";
import { DestroyService, PersianDateTimePickerService } from "./persian-date-time-picker.service";
import { CustomLabels, DateRange, LanguageLocale, YearRange } from "./utils/models";
import { CalendarType, DatePickerMode } from "./utils/types";
import { CustomTemplate } from "./utils/template.directive";
import { Subject, takeUntil, debounceTime } from "rxjs";

@Directive()
export abstract class PersianDatePickerBase implements OnInit, OnDestroy {
    // ========== Input Signals ==========
    rtl = input(false, { transform: booleanAttribute });
    selectedDate = input<Date | null>(null);
    selectedStartDate = input<Date | null>(null);
    selectedEndDate = input<Date | null>(null);
    mode = input<DatePickerMode>("day");
    isRange = input(false, { transform: booleanAttribute });
    customLabels = input<Array<CustomLabels>>([]);
    calendarType = input<CalendarType>("gregorian");
    minDate = input<Date | null>(null);
    maxDate = input<Date | null>(null);
    cssClass = input("");
    footerDescription = input("");
    activeInput = input<"start" | "end" | "" | null>(null);
    showSidebar = input(true, { transform: booleanAttribute });
    showToday = input(false, { transform: booleanAttribute });
    showTimePicker = input(false, { transform: booleanAttribute });
    timeDisplayFormat = input("HH:mm");
    dateFormat = input<string | undefined>(undefined);
    disabledDates = input<Array<Date | string>>([]);
    disabledDatesFilter = input<((date: Date) => boolean) | undefined>(undefined);
    disabledTimesFilter = input<((date: Date) => boolean) | undefined>(undefined);
    templates = input<readonly CustomTemplate[]>([]);

    // ========== Output Signals ==========
    dateSelected = output<Date>();
    dateRangeSelected = output<DateRange>();
    closePicker = output<void>();
    clearSelected = output<void>();

    // ========== State Signals ==========
    currentDate = signal<Date | undefined>(undefined);
    viewMode = signal<"days" | "months" | "years">("days");
    dateAdapterSignal = signal<DateAdapter<Date> | null>(null);

    days = computed<Date[]>(() => {
        const current = this.currentDate();
        const adapter = this.dateAdapterSignal();
        if (!current || !adapter) return [];

        const firstDayOfMonth = adapter.startOfMonth(current);
        const startDate = adapter.startOfWeek(firstDayOfMonth);
        return Array.from({ length: 42 }, (_, i) =>
            adapter.addDays(startDate, i)
        );
    });

    // ========== Class Properties ==========
    weekDays: string[] = [];
    periods: Array<CustomLabels> = [];
    selectedPeriod: any = "";
    tempEndDate: Date | null = null;
    monthListNum = Array.from({ length: 12 }, (_, i) => i + 1);
    yearRanges: Array<YearRange> = [];
    lang?: LanguageLocale;
    timeoutId: any = null;
    protected rangeEmissionSubject = new Subject<{ start: Date; end: Date | undefined }>();

    dayTemplate?: TemplateRef<any>;
    monthTemplate?: TemplateRef<any>;
    quarterTemplate?: TemplateRef<any>;
    yearTemplate?: TemplateRef<any>;

    protected touchStartX: number = 0;
    protected touchStartY: number = 0;
    protected isSwiping: boolean = false;

    get dateAdapter(): DateAdapter<Date> | null {
        return this.dateAdapterSignal();
    }

    hasSelectedDate = computed(() => this.selectedDate() !== null);
    hasSelectedRange = computed(
        () => this.selectedStartDate() !== null && this.selectedEndDate() !== null,
    );

    isDaysMode = computed(() => this.viewMode() === "days");
    isMonthsMode = computed(() => this.viewMode() === "months");
    isYearsMode = computed(() => this.viewMode() === "years");

    yearList = computed(() => {
        const currentDate = this.currentDate();
        const adapter = this.dateAdapterSignal();
        if (!adapter || !currentDate) return [];

        const currentYear = adapter.getYear(currentDate) ?? new Date().getFullYear();

        if (this.viewMode() === "years" && this.yearRanges.length > 0) {
            const currentRange = this.yearRanges.find(
                (range) => range.start <= currentYear && range.end >= currentYear,
            );
            const start = currentRange ? currentRange.start : currentYear;
            return Array.from({ length: 15 }, (_, i) => start + i);
        }

        const start = currentYear - 7;
        return Array.from({ length: 15 }, (_, i) => start + i);
    });

    elementRef = inject(ElementRef);
    changeDetectorRef = inject(ChangeDetectorRef);
    persianDateTimePickerService = inject(PersianDateTimePickerService);
    jalaliDateAdapter = inject(JalaliDateAdapter);
    gregorianDateAdapter = inject(GregorianDateAdapter);
    destroyService = inject(DestroyService);

    constructor() {
        this.initializeEffects();

        this.rangeEmissionSubject
            .pipe(debounceTime(300), takeUntil(this.destroyService))
            .subscribe((range) => {
                this.dateRangeSelected.emit(range);
            });
    }

    private initializeEffects(): void {
        effect(() => {
            const type = this.calendarType();
            const adapter =
                type === "jalali" ? this.jalaliDateAdapter : this.gregorianDateAdapter;
            this.dateAdapterSignal.set(adapter);

            this.updateLanguage();
            if (adapter) {
                this.weekDays = adapter.getDayOfWeekNames("short");
            }
        });

        effect(() => {
            const serviceLang = this.persianDateTimePickerService.languageLocaleSignal();
            if (serviceLang !== this.lang) {
                this.updateLanguage();
            }
        });

        effect(() => {
            const selectedStartDate = this.selectedStartDate();
            const selectedEndDate = this.selectedEndDate();
            const selectedDate = this.selectedDate();
            const adapter = this.dateAdapterSignal();
            if (!adapter) return;
            untracked(() => {
                this.setInitialDate();
            });
        });

        effect(() => {
            const mode = this.mode();
            const adapter = this.dateAdapterSignal();
            if (!adapter) return;
            untracked(() => {
                this.setViewMode();
            });
        });

        effect(() => {
            const min = this.minDate();
            const max = this.maxDate();
            const adapter = this.dateAdapterSignal();
            if (adapter) {
                untracked(() => {
                    this.adjustCurrentDateToValidRange();
                });
            }
        });

        effect(() => {
            const templates = this.templates();
            if (templates && templates.length > 0) {
                templates.forEach((item) => {
                    switch (item.getType()) {
                        case "day":
                            this.dayTemplate = item.templateRef;
                            break;
                        case "month":
                            this.monthTemplate = item.templateRef;
                            break;
                        case "quarter":
                            this.quarterTemplate = item.templateRef;
                            break;
                        case "year":
                            this.yearTemplate = item.templateRef;
                            break;
                    }
                });
            }
        });
    }

    public get getDate(): Date {
        return (
            this.selectedDate() ||
            this.selectedStartDate() ||
            this.selectedEndDate() ||
            new Date()
        );
    }

    ngOnInit() {
        this.initializeDateAdapter();
        this.initializeComponent();
    }

    private initializeDateAdapter(): void {
        const adapter =
            this.calendarType() === "jalali"
                ? this.jalaliDateAdapter
                : this.gregorianDateAdapter;
        this.dateAdapterSignal.set(adapter);
        this.updateLanguage();
        if (adapter) {
            this.weekDays = adapter.getDayOfWeekNames("short");
        }
    }

    private updateLanguage(): void {
        this.lang = this.persianDateTimePickerService.getLocaleForCalendarType(this.calendarType());
    }

    ngOnDestroy(): void {
        if (this.timeoutId != null) {
            clearTimeout(this.timeoutId);
        }
    }

    initializeComponent(): void {
        if (!this.dateAdapter) {
            return;
        }
        this.setInitialDate();

        if (this.mode() === "year") {
            this.showYearSelector();
        }
        this.initLabels();
    }

    initLabels(): void {
        if (!this.dateAdapter) return;
        const today = this.dateAdapter.today();
        const labels = this.customLabels();
        if (labels?.length) {
            this.periods = labels;
        } else if (this.isRange()) {
            this.generateDefaultPeriods(today);
        }
    }

    generateDefaultPeriods(today: Date): void {
        this.periods = [
            {
                label: this.lang!.lastDay,
                value: [this.dateAdapter!.addDays(today, -1), today],
            },
            {
                label: this.lang!.lastWeek,
                value: [this.dateAdapter!.addDays(today, -7), today],
                arrow: true,
            },
            {
                label: this.lang!.lastMonth,
                value: [this.dateAdapter!.addMonths(today, -1), today],
            },
            {
                label: this.lang!.custom,
                value: "custom",
            },
        ];
    }

    setViewMode(): void {
        switch (this.mode()) {
            case "day":
                this.viewMode.set("days");
                break;
            case "month":
                this.viewMode.set("months");
                break;
            case "year":
                this.viewMode.set("years");
                break;
        }
    }

    showMonthSelector(): void {
        this.viewMode.set("months");
        this.scrollToSelectedItem(this.dateAdapter!.getYear(this.getDate));
    }

    showYearSelector(): void {
        this.viewMode.set("years");
        this.generateYearRanges();
        this.scrollToSelectedItem();
    }

    // Hook point for Popup Component
    scrollToSelectedItem(id: number | null = null): void { }

    selectDate(date: Date): void {
        if (this.isDateDisabled(date)) return;

        if (this.showTimePicker()) {
            const existingDate = this.isRange()
                ? this.activeInput() === "start"
                    ? this.selectedStartDate()
                    : this.selectedEndDate()
                : this.selectedDate();

            if (existingDate) {
                date = this.applyTimeToDate(date, existingDate);
            }
        } else {
            date = this.applyTimeToDate(date, new Date());
        }

        if (this.isRange()) {
            this.handleRangeSelection(date);
        } else {
            this.handleSingleSelection(date);
        }
        this.currentDate.set(date);
    }

    handleRangeSelection(date: Date): void {
        const start = this.selectedStartDate();
        const end = this.selectedEndDate();

        if (!start || (start && end) || this.dateAdapter!.isBefore(date, start)) {
            if (!this.showTimePicker()) {
                this.persianDateTimePickerService.setActiveInput("end");
            }
            this.dateRangeSelected.emit({
                start: date,
                end: undefined,
            });
        } else {
            if (this.showTimePicker()) {
                this.persianDateTimePickerService.setActiveInput("end");
            }
            this.dateRangeSelected.emit({
                start: start,
                end: date,
            });
        }
    }

    handleSingleSelection(date: Date): void {
        this.dateSelected.emit(date);
        if (!this.showTimePicker()) {
            this.closeDatePicker();
        }
    }

    selectMonth(month: number, closeAfterSelection: boolean = false): void {
        if (this.isMonthDisabled(month)) return;

        this.currentDate.set(
            this.dateAdapter!.createDate(
                this.dateAdapter!.getYear(this.currentDate()!)!,
                month - 1,
                1,
            ),
        );

        if (this.isRange() && this.mode() === "month") {
            this.handleRangeSelection(this.currentDate()!);
            return;
        }

        if (this.mode() === "month" || closeAfterSelection) {
            this.dateSelected.emit(this.currentDate()!);
            this.closeDatePicker();
        } else {
            this.viewMode.set("days");
        }

        this.scrollToSelectedItem(month);
    }

    selectYear(year: number, sideSelector = false): void {
        if (this.isYearDisabled(year)) return;

        this.currentDate.set(
            this.dateAdapter!.createDate(
                year,
                this.dateAdapter!.getMonth(this.currentDate()!)!,
                1,
            ),
        );

        if (this.isRange() && this.mode() === "year") {
            this.handleRangeSelection(this.currentDate()!);
            return;
        }

        if (this.mode() === "year") {
            this.dateSelected.emit(this.currentDate()!);
            this.closeDatePicker();
            return;
        }

        if (sideSelector) {
            this.currentDate.set(
                this.dateAdapter!.setYear(this.selectedDate() || this.currentDate()!, year),
            );
            this.scrollToSelectedItem(year);
        } else {
            this.viewMode.set("months");
        }
    }

    goPrev(): void {
        if (this.viewMode() === "days") {
            this.prevMonth();
            return;
        }

        let id: number | null = null;
        if (this.viewMode() === "months") {
            this.currentDate.set(this.dateAdapter!.addYears(this.currentDate()!, -1));
            id = this.dateAdapter!.getYear(this.currentDate()!);
        }

        if (this.viewMode() === "years") {
            const yearList = this.yearList();
            const yearStart = yearList[0] - 15;
            id = yearList[0] - 1;
            this.currentDate.set(this.dateAdapter!.createDate(yearList[0] - 1, 0, 1));
        }

        this.scrollToSelectedItem(id!);
    }

    goNext(): void {
        if (this.viewMode() === "days") {
            this.nextMonth();
            return;
        }

        let id: number | null = null;
        if (this.viewMode() === "months") {
            this.currentDate.set(this.dateAdapter!.addYears(this.currentDate()!, 1));
            id = this.dateAdapter!.getYear(this.currentDate()!);
        }

        if (this.viewMode() === "years") {
            const yearList = this.yearList();
            const yearStart = yearList[14] + 1;
            id = yearStart;
            this.currentDate.set(this.dateAdapter!.createDate(yearList[14] + 1, 0, 1));
        }

        this.scrollToSelectedItem(id!);
    }

    prevMonth(): void {
        if (this.isPrevMonthDisabled()) return;
        this.currentDate.set(this.dateAdapter!.addMonths(this.currentDate()!, -1));
        this.scrollToSelectedItem(
            this.dateAdapter!.getMonth(this.currentDate()!)! + 1,
        );
    }

    nextMonth(): void {
        if (this.isNextMonthDisabled()) return;
        this.currentDate.set(this.dateAdapter!.addMonths(this.currentDate()!, 1));
        this.scrollToSelectedItem(
            this.dateAdapter!.getMonth(this.currentDate()!)! + 1,
        );
    }

    @HostListener('touchstart', ['$event'])
    @HostListener('mousedown', ['$event'])
    handleTouchStart(event: TouchEvent | MouseEvent): void {
        this.touchStartX = 'touches' in event ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX;
        this.touchStartY = 'touches' in event ? (event as TouchEvent).touches[0].clientY : (event as MouseEvent).clientY;
        this.isSwiping = true;
    }

    @HostListener('touchmove', ['$event'])
    @HostListener('mousemove', ['$event'])
    handleTouchMove(event: TouchEvent | MouseEvent): void {
        if (!this.isSwiping) return;

        const touchEndX = 'touches' in event ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX;
        const touchEndY = 'touches' in event ? (event as TouchEvent).touches[0].clientY : (event as MouseEvent).clientY;

        const diffX = this.touchStartX - touchEndX;
        const diffY = this.touchStartY - touchEndY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            event.preventDefault();

            if (diffX > 0) {
                this.goNext();
            } else {
                this.goPrev();
            }

            this.isSwiping = false;
        }
    }

    @HostListener('touchend')
    @HostListener('mouseup')
    handleTouchEnd(): void {
        this.isSwiping = false;
    }

    isSelected(date: Date): boolean {
        if (this.isRange()) {
            return this.isRangeStart(date)! || this.isRangeEnd(date)!;
        }
        return !!(
            this.selectedDate() &&
            this.dateAdapter!.isSameDay(date, this.selectedDate()!)
        );
    }

    isRangeStart(date: Date): boolean | null {
        return (
            this.isRange() &&
            this.selectedStartDate() &&
            this.dateAdapter!.isSameDay(date, this.selectedStartDate()!)
        );
    }

    isRangeEnd(date: Date): boolean | null {
        return (
            this.isRange() &&
            this.selectedEndDate() &&
            this.dateAdapter!.isSameDay(date, this.selectedEndDate()!)
        );
    }

    isInRange(date: Date): boolean | null {
        return (
            this.isRange() &&
            this.selectedStartDate() &&
            (this.selectedEndDate() || this.tempEndDate) &&
            this.dateAdapter!.isAfter(date, this.selectedStartDate()!) &&
            this.dateAdapter!.isBefore(
                date,
                this.selectedEndDate()! || this.tempEndDate!,
            )
        );
    }

    isToday(date: Date): boolean {
        return (
            this.dateAdapter!.isSameDay(date, this.dateAdapter!.today())! &&
            this.showToday()!
        );
    }

    isActiveMonth(month: number): boolean {
        return this.dateAdapter!.getMonth(this.currentDate()!) === month - 1;
    }

    isActiveYear(year: number): boolean {
        return year === this.dateAdapter!.getYear(this.currentDate()!);
    }

    isDateDisabled(date: Date): boolean {
        const adapter = this.dateAdapterSignal();
        if (!adapter) return false;

        const min = this.minDate();
        const max = this.maxDate();
        if (
            (min && adapter.isBefore(date, min)) ||
            (max && adapter.isAfter(date, max))
        ) {
            return true;
        }

        const parsedDisabledDates = this.parseDisabledDates();
        const isDisabledDate = parsedDisabledDates.some((disabledDate) =>
            adapter.isSameDay(date, disabledDate),
        );

        const filter = this.disabledDatesFilter();
        const isFilterDisabled = filter ? filter(date) : false;

        return isDisabledDate || isFilterDisabled;
    }

    isMonthDisabled(month: number): boolean {
        const year = this.dateAdapter!.getYear(this.currentDate()!);
        const startOfMonth = this.dateAdapter!.createDate(year!, month - 1, 1);

        const daysInMonth = this.dateAdapter!.getDaysInMonth(startOfMonth);
        let allDaysDisabled = true;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = this.dateAdapter!.createDate(year!, month - 1, day);
            if (!this.isDateDisabled(date)) {
                allDaysDisabled = false;
                break;
            }
        }

        return allDaysDisabled;
    }

    isYearDisabled(year: number): boolean {
        const min = this.minDate();
        const max = this.maxDate();

        if (min && this.dateAdapter!.getYear(min)! > year) return true;
        if (max && this.dateAdapter!.getYear(max)! < year) return true;

        const firstOfMonth = this.dateAdapter!.createDate(year, 0, 1);
        let day = 1;

        for (
            let date = firstOfMonth;
            date.getFullYear() == firstOfMonth.getFullYear();
            date = this.dateAdapter!.addDays(firstOfMonth, day++)
        ) {
            if (!this.isDateDisabled(date)) {
                return false;
            }
        }

        return true;
    }

    isPrevMonthDisabled(): boolean {
        const min = this.minDate();
        if (!min) return false;

        const minYear = this.dateAdapter!.getYear(min)!;

        switch (this.viewMode()) {
            case "days":
                const prevMonth = this.dateAdapter!.getMonth(this.currentDate()!)! - 1;
                return this.dateAdapter!.getMonth(min)! > prevMonth;
            case "months":
                const prevYear = this.dateAdapter!.getYear(this.currentDate()!)! - 1;
                return minYear > prevYear;
            case "years":
                return minYear > this.yearList()[this.yearList().length - 1];
            default:
                return false;
        }
    }

    isNextMonthDisabled(): boolean {
        const max = this.maxDate();
        if (!max) return false;

        const maxYear = this.dateAdapter!.getYear(max)!;

        switch (this.viewMode()) {
            case "days":
                const nextMonth = this.dateAdapter!.getMonth(this.currentDate()!)! + 1;
                return this.dateAdapter!.getMonth(max)! < nextMonth;
            case "months":
                const nextYear = this.dateAdapter!.getYear(this.currentDate()!)! + 1;
                return maxYear < nextYear;
            case "years":
                return maxYear < this.yearList()[0];
            default:
                return false;
        }
    }

    parseDisabledDates(): Date[] {
        const adapter = this.dateAdapterSignal();
        if (!adapter) return [];

        return this.disabledDates()
            .map((date) => {
                if (date instanceof Date) {
                    return adapter.startOfDay(date);
                }
                const parsedDate = adapter.parse(date, this.dateFormat()!);
                return parsedDate || null;
            })
            .filter((date) => date !== null) as Date[];
    }

    onMouseEnter(date: Date, event: Event): void {
        if (this.isRange() && this.selectedStartDate() && !this.selectedEndDate()) {
            this.tempEndDate = date;
        }
    }

    getMonthName(month: number): string {
        return this.dateAdapter!.getMonthNames("long")[month - 1];
    }

    getCurrentMonthName(): string {
        return this.dateAdapter!.getMonthNames("long")[
            this.dateAdapter!.getMonth(this.currentDate()!)!
        ];
    }

    getCurrentYear(): number {
        return this.dateAdapter!.getYear(this.currentDate()!)!;
    }

    getWeekDays(): string[] {
        return this.weekDays;
    }

    isSameMonth(date1: Date, date2: Date): boolean {
        return this.dateAdapter!.isSameMonth(date1, date2);
    }

    closeDatePicker(): void {
        this.closePicker.emit();
    }

    generateYearRanges(length: number = 15): void {
        const yearCount = 15;
        const currentYear = this.dateAdapter!.getYear(this.dateAdapter!.today()!)!;
        const startYear =
            currentYear -
            Math.floor(yearCount / 2) -
            yearCount * Math.floor(length / 2);
        this.yearRanges = [];

        for (let i = 0; i < length; i++) {
            const start = startYear + i * yearCount;
            this.yearRanges.push({
                start,
                end: start + 14,
            });
        }
    }

    onTimeChange(time: string | Date): void {
        const timeDate = time instanceof Date ? time : new Date(time);

        if (!this.isRange()) {
            this.updateSingleDateTime(timeDate);
        } else {
            this.updateRangeDateTime(timeDate);
        }
    }

    updateSingleDateTime(timeDate: Date): void {
        let selected = this.selectedDate();
        if (!selected) {
            selected = this.dateAdapter!.today();
        }

        const updatedDate = this.applyTimeToDate(selected, timeDate);
        this.dateSelected.emit(updatedDate);
    }

    updateRangeDateTime(timeDate: Date): void {
        if (this.activeInput() === "start") {
            const start = this.selectedStartDate();
            if (start) {
                const updatedDate = this.applyTimeToDate(start, timeDate);
                this.dateRangeSelected.emit({
                    start: updatedDate,
                    end: undefined,
                });
            }
        } else if (this.activeInput() === "end") {
            const end = this.selectedEndDate();
            if (end) {
                const updatedDate = this.applyTimeToDate(end, timeDate);
                this.rangeEmissionSubject.next({
                    start: this.selectedStartDate()!,
                    end: updatedDate,
                });
            }
        }
    }

    onTodayClick() {
        const now = new Date();
        this.currentDate.set(now);
        this.dateSelected.emit(now);
        this.selectDate(now);
    }

    onOkClick() {
        if (this.isRange()) {
            this.dateRangeSelected.emit({
                start: this.selectedStartDate()!,
                end: this.selectedEndDate()!,
            });
            this.closeDatePicker();
        } else {
            const selected = this.selectedDate();
            if (!selected) {
                return;
            }
            this.dateSelected.emit(selected);
            this.closeDatePicker();
        }
    }

    onClearClick() {
        this.clearSelected.emit();
        this.closeDatePicker();
    }

    setInitialDate(): void {
        if (!this.dateAdapter) return;
        this.currentDate.set(this.determineInitialDate());
        this.setViewMode();
        this.adjustCurrentDateToValidRange();
    }

    determineInitialDate(): Date {
        if (!this.dateAdapter) return new Date();
        if (this.isRange()) {
            if (this.activeInput() === "start") {
                return (
                    this.selectedStartDate() || this.dateAdapter?.today() || new Date()
                );
            }
            return (
                this.selectedEndDate() ||
                this.selectedStartDate() ||
                this.dateAdapter?.today() ||
                new Date()
            );
        }

        return this.selectedDate() || this.dateAdapter?.today() || new Date();
    }

    adjustCurrentDateToValidRange(): void {
        if (!this.dateAdapter) return;
        let adjustedDate = this.currentDate();
        const min = this.minDate();
        const max = this.maxDate();

        if (min && this.dateAdapter!.isBefore(adjustedDate!, min)) {
            adjustedDate = min;
        } else if (max && this.dateAdapter!.isAfter(adjustedDate!, max)) {
            adjustedDate = max;
        }

        if (!this.dateAdapter!.isSameDay(this.currentDate()!, adjustedDate!)) {
            this.currentDate.set(adjustedDate);
        }
    }

    protected applyTimeToDate(date: Date, timeDate: Date): Date {
        let updatedDate = this.dateAdapter!.setHours(date, timeDate.getHours());
        updatedDate = this.dateAdapter!.setMinutes(
            updatedDate,
            timeDate.getMinutes(),
        );
        updatedDate = this.dateAdapter!.setSeconds(
            updatedDate,
            timeDate.getSeconds(),
        );
        return updatedDate;
    }
}
