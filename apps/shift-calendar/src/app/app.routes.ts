import { Route } from '@angular/router';
import { authGuard, guestGuard, LoginPageComponent } from '@shiftly/core-auth';

export const appRoutes: Route[] = [
  {
    path: 'login',
    canActivate: [guestGuard],
    component: LoginPageComponent,
  },
  {
    path: 'calendar',
    canActivate: [authGuard],
    loadChildren: () => import('@shiftly/calendar-feature').then((module) => module.calendarRoutes),
  },
  { path: '', pathMatch: 'full', redirectTo: 'calendar' },
  { path: '**', redirectTo: 'calendar' },
];
