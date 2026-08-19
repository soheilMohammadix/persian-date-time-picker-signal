import {InjectionToken} from '@angular/core';

export interface PersianDateTimePickerConfig {
  /** CSS class name to detect dark mode on <html>. Default: 'dark' */
  darkModeClass?: string;
}

export const PERSIAN_DATE_TIME_PICKER_CONFIG =
  new InjectionToken<PersianDateTimePickerConfig>('PERSIAN_DATE_TIME_PICKER_CONFIG');
