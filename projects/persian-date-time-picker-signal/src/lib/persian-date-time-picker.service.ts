import {Injectable, OnDestroy, signal, computed, DestroyRef} from "@angular/core";
import {BehaviorSubject, Subject, takeUntil} from "rxjs";
import {EnglishLocale, LanguageLocale, PersianLocale} from "./utils/models";

export interface ValidTimeResult {
  isValid: boolean;
  normalizedTime: string;
}

@Injectable()
export class PersianDateTimePickerService {
  // Legacy BehaviorSubject for backward compatibility during migration
  activeInput: BehaviorSubject<string> = new BehaviorSubject('');
  languageLocale?: LanguageLocale;

  // Signal-based state (new)
  readonly activeInputSignal = signal<'start' | 'end' | ''>('');
  readonly languageLocaleSignal = signal<LanguageLocale | undefined>(undefined);

  // ========== Dark Mode ==========

  /** Consumer-facing: 'auto' (default) | 'light' | 'dark' */
  readonly theme = signal<'auto' | 'light' | 'dark'>('auto');

  /** True when the OS prefers dark scheme (backed by matchMedia) */
  private readonly _prefersDark = signal(false);

  /** True when <html> has class 'dark' (backed by MutationObserver) */
  private readonly _htmlHasDark = signal(false);

  /** Computed — single source of truth */
  readonly isDark = computed(() => {
    const t = this.theme();
    if (t === 'light') return false;
    if (t === 'dark') return true;
    return this._prefersDark() || this._htmlHasDark();
  });

  constructor(
    public persianLocale: PersianLocale,
    public englishLocale: EnglishLocale,
    private destroyRef: DestroyRef
  ) {
    this._setupDarkModeDetection();
  }

  private _setupDarkModeDetection(): void {
    // 1) prefers-color-scheme media query
    const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
    this._prefersDark.set(darkMq.matches);
    darkMq.addEventListener('change', (e: MediaQueryListEvent) => {
      this._prefersDark.set(e.matches);
    });

    // 2) MutationObserver for .dark class on <html>
    const observer = new MutationObserver(() => {
      this._htmlHasDark.set(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});

    // Cleanup observer when service is destroyed
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  // Method to update both BehaviorSubject and signal
  setActiveInput(value: 'start' | 'end' | '') {
    this.activeInput.next(value);
    this.activeInputSignal.set(value);
  }

  // Method to update language locale for both
  setLanguageLocale(locale: LanguageLocale | undefined) {
    this.languageLocale = locale;
    this.languageLocaleSignal.set(locale);
  }

  // Method to get appropriate locale based on calendar type
  getLocaleForCalendarType(calendarType: 'jalali' | 'gregorian'): LanguageLocale {
    return this.languageLocaleSignal() || 
           (calendarType === 'jalali' ? this.persianLocale : this.englishLocale);
  }

  // Method to convert numbers based on locale setting
  convertNumbers(number: number | string): string {
    const locale = this.languageLocaleSignal();
    if (!locale?.usePersianNumbers) {
      return number.toString();
    }
    
    // Convert to Persian/Arabic numbers
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const latinNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    return number.toString().replace(/[0-9]/g, (match) => {
      const index = latinNumbers.indexOf(match);
      return index !== -1 ? persianNumbers[index] : match;
    });
  }

  // Legacy BehaviorSubject access for components still using RxJS
  get activeInput$() {
    return this.activeInput.asObservable();
  }
}

@Injectable()
export class DestroyService extends Subject<void> implements OnDestroy {
  constructor(private destroyRef: DestroyRef) {
    super();
    // Set up destroyRef to complete the subject when destroyed
    this.destroyRef.onDestroy(() => {
      this.next();
      this.complete();
    });
  }

  ngOnDestroy(): void {
    this.next();
    this.complete();
  }
}
