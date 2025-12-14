import { Pipe, PipeTransform } from '@angular/core';
import { PersianDateTimePickerService } from '../persian-date-time-picker.service';

@Pipe({
  name: 'convertNumbers',
  standalone: true
})
export class ConvertNumbersPipe implements PipeTransform {
  constructor(private persianDateTimePickerService: PersianDateTimePickerService) {}

  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    // Convert to string first, then apply number conversion
    const stringValue = typeof value === 'string' ? value : value.toString();
    return this.persianDateTimePickerService.convertNumbers(stringValue);
  }
}