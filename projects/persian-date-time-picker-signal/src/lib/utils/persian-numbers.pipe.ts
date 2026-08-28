import { Pipe, PipeTransform } from '@angular/core';
import { PersianDateTimePickerService } from '../persian-date-time-picker.service';

@Pipe({
  name: 'persianNumbers',
  standalone: true
})
export class PersianNumbersPipe implements PipeTransform {
  constructor(private persianDateTimePickerService: PersianDateTimePickerService) {}

  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    
    // Check if we should use Persian numbers
    const locale = this.persianDateTimePickerService.languageLocaleSignal();
    if (!locale?.usePersianNumbers) {
      return value; // Return original for English
    }
    
    // Convert Latin numbers to Persian/Arabic numbers
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const latinNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    return value.replace(/[0-9]/g, (match) => {
      const index = latinNumbers.indexOf(match);
      return index !== -1 ? persianNumbers[index] : match;
    });
  }
}