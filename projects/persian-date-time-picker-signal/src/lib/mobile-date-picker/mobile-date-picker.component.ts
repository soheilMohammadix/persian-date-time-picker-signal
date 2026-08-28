import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from "@angular/core";
import { TimePickerComponent } from "../time-picker/time-picker.component";
import { ConvertNumbersPipe } from '../utils/convert-numbers.pipe';
import { PersianDatePickerBase } from "../date-picker-base.directive";
import { YearRange } from "../utils/models";

@Component({
  selector: "mobile-date-picker",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TimePickerComponent, ConvertNumbersPipe],
  templateUrl: "./mobile-date-picker.component.html",
  styleUrls: ["./mobile-date-picker.component.scss"],
})
export class MobileDatePickerComponent extends PersianDatePickerBase {
  activeTab = signal<"date" | "time">("date");

  isActiveYearRange(startYear: number): boolean {
    return startYear === this.yearList()[0];
  }

  isYearRangeDisabled(yearRange: YearRange): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    if (min && this.dateAdapter!.getYear(min)! > yearRange.end) return true;
    if (max && this.dateAdapter!.getYear(max)! < yearRange.start) return true;

    for (let year = yearRange.start; year <= yearRange.end; year++) {
      if (!this.isYearDisabled(year)) {
        return false;
      }
    }

    return true;
  }

  // ========== Display Methods ==========
  getSelectedDateDisplay(): string {
    const adapter = this.dateAdapterSignal();
    if (!adapter) return '';

    const date = this.selectedDate() || this.selectedStartDate() || adapter.today();
    return adapter.format(date, this.dateFormat() || 'yyyy/MM/dd');
  }

  getSelectedTimeDisplay(): string {
    const adapter = this.dateAdapterSignal();
    if (!adapter) return '';

    const date = this.selectedDate() || this.selectedStartDate() || adapter.today();
    return adapter.format(date, this.timeDisplayFormat() || 'HH:mm');
  }
}
