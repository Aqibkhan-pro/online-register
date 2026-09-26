import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AdminAuth } from './admin/admin-auth';

describe('App', () => {
  async function render(isAdmin: boolean): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        // Stand-in for Firebase Auth so tests never touch the network.
        { provide: AdminAuth, useValue: { user: signal(isAdmin ? {} : null), isAdmin: signal(isAdmin), signOut: async () => {} } }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('should show a Sign in button to visitors', async () => {
    const actions = (await render(false)).querySelector('.header-actions')?.textContent;
    expect(actions).toContain('Sign in');
    expect(actions).not.toContain('Admin Panel');
  });

  it('should show Admin Panel and Sign out to admins', async () => {
    const actions = (await render(true)).querySelector('.header-actions')?.textContent;
    expect(actions).toContain('Admin Panel');
    expect(actions).toContain('Sign out');
    expect(actions).not.toContain('Sign in');
  });
});
