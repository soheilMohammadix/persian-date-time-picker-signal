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
/**
 * - 'jalali' / 'gregorian': formatted string via the `format` input (no timezone designator)
 * - 'date': raw JS Date object (local time)
 * - 'iso': ISO 8601 string with timezone (e.g. 2024-08-11T00:00:00.000Z),
 *    unambiguous for backends
 */
export type ValueFormat = 'jalali' | 'gregorian' | 'date' | 'iso';
