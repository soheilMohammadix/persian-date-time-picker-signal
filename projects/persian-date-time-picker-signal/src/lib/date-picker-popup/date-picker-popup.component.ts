import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  output,
  viewChild,
} from "@angular/core";
import { TimePickerComponent } from "../time-picker/time-picker.component";
import { NgTemplateOutlet } from "@angular/common";
import { ConvertNumbersPipe } from '../utils/convert-numbers.pipe';
import { PersianDatePickerBase } from "../date-picker-base.directive";
import { takeUntil } from "rxjs";

@Component({
  selector: "persian-date-picker-popup",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, TimePickerComponent, ConvertNumbersPipe],
  templateUrl: "./date-picker-popup.component.html",
  styleUrls: ["./date-picker-popup.component.scss"],
  host: {
    '[class.dtp-dark]': 'persianDateTimePickerService.isDark()'
  }
})
export class DatePickerPopupComponent
  extends PersianDatePickerBase
  implements AfterViewInit {

  // ========== Output Signals ==========
  clickInside = output<boolean>();

  // ========== Queries ==========
  itemSelector = viewChild<ElementRef>("itemSelector");
  timePicker = viewChild(TimePickerComponent);

  @HostListener("click")
  onClickInside(): void {
    this.clickInside.emit(true);
  }

  ngAfterViewInit() {
    this.scrollToSelectedItem();
    this.setTimePickerDate();
  }

  // ========== Scroll Management ==========
  override scrollToSelectedItem(id: number | null = null): void {
    if (!this.showSidebar()) return;

    if (this.timeoutId != null) {
      clearTimeout(this.timeoutId);
    }

    const itemId = this.determineScrollItemId(id);
    if (!itemId || !this.itemSelector()) return;

    this.timeoutId = setTimeout(() => {
      const selectedElement = this.itemSelector()!.nativeElement.querySelector(
        `#selector_${itemId}`,
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "instant",
          block: "center",
        });
      }
    }, 200);
  }

  determineScrollItemId(id: number | null): number | null {
    if (id != null) return id;
    if (!this.getDate) return null;

    switch (this.viewMode()) {
      case "days":
        return this.dateAdapter!.getMonth(this.getDate)! + 1;
      case "months":
        return this.dateAdapter!.getYear(this.getDate)!;
      case "years":
        const currentYear = this.dateAdapter!.getYear(this.getDate)!;
        const currentRange = this.yearRanges.find(
          (range) => range.start <= currentYear && range.end >= currentYear,
        );
        return currentRange?.start || null;
      default:
        return null;
    }
  }

  setTimePickerDate(date?: Date) {
    if (this.showTimePicker() && this.timePicker()) {
      if (this.isRange()) {
        this.persianDateTimePickerService.activeInput$
          .pipe(takeUntil(this.destroyService))
          .subscribe((active) => {
            if (active == "start") {
              this.timePicker()!.updateFromDate(this.selectedStartDate());
            } else {
              this.timePicker()!.updateFromDate(this.selectedEndDate());
            }
            this.timePicker()!.scrollToTime();
          });
      } else {
        this.timePicker()!.updateFromDate(date || this.selectedDate());
        this.timePicker()!.scrollToTime();
      }
    }
  }

  selectYearRange(startYear: number): void {
    this.viewMode.set("years");
    this.scrollToSelectedItem(startYear);
  }
}
