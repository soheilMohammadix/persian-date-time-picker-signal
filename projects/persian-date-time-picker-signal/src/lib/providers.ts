import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { PersianDateTimePickerService } from './persian-date-time-picker.service';
import { DestroyService } from './persian-date-time-picker.service';
import { EnglishLocale, PersianLocale } from './utils/models';
import { PersianDateTimePickerConfig } from './utils/types';

export const PERSIAN_DATE_TIME_PICKER_CONFIG = new InjectionToken<PersianDateTimePickerConfig>('PERSIAN_DATE_TIME_PICKER_CONFIG');

/**
 * Provides the picker services (and optional config) at the application root:
 * `providePersianDateTimePicker()` in `app.config.ts`.
 */
export function providePersianDateTimePicker(config?: PersianDateTimePickerConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PERSIAN_DATE_TIME_PICKER_CONFIG, useValue: config ?? {} },
    PersianDateTimePickerService,
    DestroyService,
    PersianLocale,
    EnglishLocale,
  ]);
}
