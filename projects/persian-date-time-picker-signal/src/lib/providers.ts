<<<<<<< HEAD
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
=======
import {EnvironmentProviders, makeEnvironmentProviders} from '@angular/core';
import {PersianDateTimePickerConfig, PERSIAN_DATE_TIME_PICKER_CONFIG} from './persian-date-time-picker.config';
import {PersianDateTimePickerService, DestroyService} from './persian-date-time-picker.service';
import {PersianLocale, EnglishLocale} from './utils/models';

export function providePersianDateTimePicker(
  config?: PersianDateTimePickerConfig
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {provide: PERSIAN_DATE_TIME_PICKER_CONFIG, useValue: config ?? {}},
    PersianDateTimePickerService,
    DestroyService,
    PersianLocale,
    EnglishLocale
>>>>>>> a3420b36c598a313a6a42748f38987da97cafc81
  ]);
}
