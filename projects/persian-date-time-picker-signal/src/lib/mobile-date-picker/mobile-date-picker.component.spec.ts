import { TestBed, ComponentFixture } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { MobileDatePickerComponent } from "./mobile-date-picker.component";
import { GregorianDateAdapter, JalaliDateAdapter } from "../date-adapter";
import { DestroyService, PersianDateTimePickerService } from "../persian-date-time-picker.service";

/**
 * Regression spec: year-selection pagination on mobile.
 *
 * Bug report: "The Date picker in mobiles can't change pages of the year selection".
 *
 * This spec renders the real MobileDatePickerComponent and verifies the Angular
 * signal reactivity (OnPush + computed `yearList`) when paginating years via
 * goNext()/goPrev() — the same methods the header ‹ › buttons and the swipe
 * gesture handler invoke.
 */
describe("MobileDatePickerComponent — year pagination", () => {
  let fixture: ComponentFixture<MobileDatePickerComponent>;
  let component: MobileDatePickerComponent;

  function createComponent(calendarType: "gregorian" | "jalali"): void {
    fixture = TestBed.createComponent(MobileDatePickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("calendarType", calendarType);
    fixture.detectChanges(); // runs ngOnInit + effects
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileDatePickerComponent],
      providers: [
        provideZonelessChangeDetection(),
        PersianDateTimePickerService,
        DestroyService,
      ],
    }).compileComponents();
  });

  it("paginates forward and backward through 15-year pages (gregorian)", () => {
    createComponent("gregorian");

    const gregorian = TestBed.inject(GregorianDateAdapter);
    const todayYear = gregorian.getYear(gregorian.today())!;

    // Enter year selection mode (mimics tapping the year title)
    component.showYearSelector();
    fixture.detectChanges();

    const firstPage = component.yearList();
    expect(firstPage.length).toBe(15);
    const firstPageStart = firstPage[0];
    const firstPageEnd = firstPage[14];
    // sanity: today must be within the first rendered page
    expect(todayYear).toBeGreaterThanOrEqual(firstPageStart);
    expect(todayYear).toBeLessThanOrEqual(firstPageEnd);

    // Paginate FORWARD
    component.goNext();
    fixture.detectChanges();
    const secondPage = component.yearList();
    expect(secondPage[0]).toBe(firstPageEnd + 1, "goNext should advance by exactly one 15-year page");

    // Paginate FORWARD again
    component.goNext();
    fixture.detectChanges();
    const thirdPage = component.yearList();
    expect(thirdPage[0]).toBe(secondPage[14] + 1);

    // Paginate BACKWARD — should return to the second page
    component.goPrev();
    fixture.detectChanges();
    const backPage = component.yearList();
    expect(backPage[0]).toBe(secondPage[0]);
    expect(backPage[14]).toBe(secondPage[14]);
  });

  it("paginates forward and backward through 15-year pages (jalali)", () => {
    createComponent("jalali");

    const jalali = TestBed.inject(JalaliDateAdapter);

    component.showYearSelector();
    fixture.detectChanges();

    const firstPage = component.yearList();
    expect(firstPage.length).toBe(15);
    const firstPageEnd = firstPage[14];

    component.goNext();
    fixture.detectChanges();
    const secondPage = component.yearList();
    expect(secondPage[0]).toBe(firstPageEnd + 1);

    component.goPrev();
    fixture.detectChanges();
    expect(component.yearList()[0]).toBe(firstPage[0]);

    // smoke-check that the adapter round-trips the paginated year correctly
    const yearOfCurrent = jalali.getYear(component.currentDate()!);
    expect(yearOfCurrent).not.toBeNull();
  });

  it("does not throw when paginating years before any range is generated (fallback branch)", () => {
    createComponent("gregorian");

    // Force years mode WITHOUT calling showYearSelector (yearRanges stays empty)
    component.viewMode.set("years");
    fixture.detectChanges();

    const before = component.yearList().slice();

    expect(() => {
      component.goNext();
      fixture.detectChanges();
    }).not.toThrow();

    const after = component.yearList();
    expect(after.length).toBe(15);
    // Even in the fallback branch the page must visibly change.
    expect(after[0]).not.toBe(before[0]);
  });

  it("paginates when the rendered ‹ › header buttons are clicked", () => {
    createComponent("gregorian");

    component.showYearSelector();
    fixture.detectChanges();

    const firstPageEnd = component.yearList()[14];

    const nextButton: HTMLButtonElement =
      fixture.nativeElement.querySelector(".nav-button.next");
    expect(nextButton).toBeTruthy();
    expect(nextButton.disabled).toBe(false);

    nextButton.click();
    fixture.detectChanges();

    expect(component.yearList()[0]).toBe(firstPageEnd + 1);
  });

  it("paginates when the swipe gesture handler detects a horizontal drag", () => {
    createComponent("gregorian");

    component.showYearSelector();
    fixture.detectChanges();

    const firstPageEnd = component.yearList()[14];

    // Simulate a left-swipe (finger moves left) — should call goNext().
    const startTouch = { clientX: 200, clientY: 100 } as Partial<Touch>;
    const endTouch = { clientX: 120, clientY: 100 } as Partial<Touch>; // 80px leftward > threshold(50)

    (component as any).handleTouchStart({ touches: [startTouch] });
    (component as any).handleTouchMove({ touches: [endTouch], preventDefault: () => {} });
    fixture.detectChanges();

    expect(component.yearList()[0]).toBe(firstPageEnd + 1);
  });
});
