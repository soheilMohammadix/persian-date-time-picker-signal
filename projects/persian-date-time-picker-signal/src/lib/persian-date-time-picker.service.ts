import {Injectable, OnDestroy, signal, DestroyRef} from "@angular/core";
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

  constructor(public persianLocale: PersianLocale, public englishLocale: EnglishLocale) {
  }

  // Legacy methods for backward compatibility
  getActiveInputValue() {
    return this.activeInput.getValue();
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
