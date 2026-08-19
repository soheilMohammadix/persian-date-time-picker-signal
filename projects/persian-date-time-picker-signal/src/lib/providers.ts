import {EnvironmentProviders, makeEnvironmentProviders} from '@angular/core';
import {PersianDateTimePickerConfig, PERSIAN_DATE_TIME_PICKER_CONFIG} from './persian-date-time-picker.config';

export function providePersianDateTimePicker(
  config?: PersianDateTimePickerConfig
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {provide: PERSIAN_DATE_TIME_PICKER_CONFIG, useValue: config ?? {}}
  ]);
}
