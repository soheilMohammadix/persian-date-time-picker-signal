export type Placement = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
export type RangePartType = 'start' | 'end' | '';
export type CalendarType = 'jalali' | 'gregorian';
export type DatePickerMode = 'day' | 'month' | 'year';
export type TimeValueType = 'date' | 'string';

export interface TimeConfig {
  hour: number;
  minute: number;
  second: number;
  period?: string;
}

export type TimeFormat = '12' | '24';
export type ScrollBehavior = 'smooth' | 'auto';
<<<<<<< HEAD
export type ValueFormat = 'jalali' | 'gregorian' | 'date';

/** Global picker configuration provided via `providePersianDateTimePicker`. */
export interface PersianDateTimePickerConfig {
  /** CSS class name to detect dark mode on <html>. Default: 'dark' */
  darkModeClass?: string;
  /** Whether to detect OS dark mode via prefers-color-scheme. Default: true */
  detectPrefersColorScheme?: boolean;
}
=======
/**
 * - 'jalali' / 'gregorian': formatted string via the `format` input (no timezone designator)
 * - 'date': raw JS Date object (local time)
 * - 'iso': ISO 8601 string with timezone (e.g. 2024-08-11T00:00:00.000Z),
 *    unambiguous for backends
 */
export type ValueFormat = 'jalali' | 'gregorian' | 'date' | 'iso';
>>>>>>> a3420b36c598a313a6a42748f38987da97cafc81
