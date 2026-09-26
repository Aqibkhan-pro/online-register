import { Routes } from '@angular/router';
import { adminGuard } from './admin/admin-auth';
import { VerificationPage } from './verification/verification-page';

export const routes: Routes = [
  { path: '', component: VerificationPage },
  // Admin pages are lazy-loaded so public visitors don't download them.
  { path: 'login', loadComponent: () => import('./admin/login-page').then((m) => m.LoginPage) },
  { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./admin/records-page').then((m) => m.RecordsPage) },
  { path: 'admin/new', canActivate: [adminGuard], loadComponent: () => import('./admin/record-form-page').then((m) => m.RecordFormPage) },
  { path: 'admin/edit/:verificationCode', canActivate: [adminGuard], loadComponent: () => import('./admin/record-form-page').then((m) => m.RecordFormPage) },
  { path: '**', redirectTo: '' }
];
