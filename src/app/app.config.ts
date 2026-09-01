import {ApplicationConfig, provideZonelessChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideAnimations} from '@angular/platform-browser/animations';
import {providePersianDateTimePicker} from 'persian-date-time-picker-signal';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideRouter(routes), provideAnimations(), providePersianDateTimePicker({darkModeClass: 'my-app-dark', detectPrefersColorScheme: false})]
};
