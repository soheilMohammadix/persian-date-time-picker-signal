import {Injectable} from "@angular/core";

export interface CustomLabels {
  label: string,
  value: Array<Date> | 'custom',
  arrow?: boolean
}

export interface YearRange {
  start: number,
  end: number
}

export interface DateRange {
  start: Date | null,
  end?: Date | null
}

export interface RangeInputLabels {
  start: string,
  end: string,
}

export interface LanguageLocale {
  today: string;
  lastDay: string;
  lastWeek: string;
  lastMonth: string;
  custom: string;
  previousMonth: string;
  nextMonth: string;
  previousYear: string;
  nextYear: string;
  selectTime: string;
  selectDate: string;
  selectMonth: string;
  selectYear: string;
  selectDateRange: string;
  startDate: string;
  endDate: string;
  pm: string;
  am: string;
  ok: string;
  cancel: string;
  now: string;
  hour: string
  minute: string
  second: string
  usePersianNumbers: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PersianLocale implements LanguageLocale {
  today = "امروز";
  lastDay = "آخرین روز";
  lastWeek = "آخرین هفته";
  lastMonth = "آخرین ماه";
  custom = "دلخواه";
  previousMonth = "ماه قبل";
  nextMonth = "ماه بعد";
  previousYear = "سال قبل";
  nextYear = "سال بعد";
  selectTime = "انتخاب زمان";
  selectDate = "انتخاب تاریخ";
  selectMonth = "انتخاب ماه";
  selectYear = "انتخاب سال";
  selectDateRange = "انتخاب محدوده تاریخ";
  startDate = "از تاریخ";
  endDate = "تا تاریخ";
  pm = "ب.ظ";
  am = "ق.ظ";
  ok = "تایید";
  cancel = "لغو";
  now = "اکنون";
  hour = 'ساعت'
  minute = 'دقیقه'
  second = 'ثانیه'
  usePersianNumbers = true;
}

@Injectable({
  providedIn: 'root'
})
export class EnglishLocale implements LanguageLocale {
  today = "Today";
  lastDay = "Last Day";
  lastWeek = "Last Week";
  lastMonth = "Last Month";
  custom = "Custom";
  previousMonth = "Previous Month";
  nextMonth = "Next Month";
  previousYear = "Previous Year";
  nextYear = "Next Year";
  selectTime = "Select time";
  selectDate = "Select date";
  selectMonth = "Select month";
  selectYear = "Select year";
  selectDateRange = "Select date range";
  startDate = "Start date";
  endDate = "End date";
  pm = "PM";
  am = "AM";
  ok = "Ok";
  cancel = "Cancel";
  now = "Now";
  hour = 'Hour'
  minute = 'Minute'
  second = 'Second'
  usePersianNumbers = false;
}
