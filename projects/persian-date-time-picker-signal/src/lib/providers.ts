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
  ]);
}
