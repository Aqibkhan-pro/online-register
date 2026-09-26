import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { AdminAuth, NotAdminError } from './admin-auth';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginPage {
  private readonly auth = inject(AdminAuth);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly signingIn = signal(false);
  readonly error = signal('');

  async signIn(): Promise<void> {
    this.signingIn.set(true);
    this.error.set('');
    try {
      await this.auth.signIn(this.email.trim(), this.password);
      await this.router.navigateByUrl('/admin');
    } catch (error) {
      this.error.set(signInErrorMessage(error));
    } finally {
      this.signingIn.set(false);
    }
  }
}

function signInErrorMessage(error: unknown): string {
  if (error instanceof NotAdminError) return 'This account does not have admin access.';
  switch (error instanceof FirebaseError ? error.code : '') {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled in Firebase Authentication.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      console.error('Sign-in failed', error);
      return 'Sign-in failed. Please try again.';
  }
}
