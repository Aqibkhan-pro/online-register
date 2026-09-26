import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { AdminAuth, NotAdminError } from './admin-auth';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let signIn: (email: string, password: string) => Promise<void>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      // Stand-in for Firebase Auth so tests never touch the network.
      providers: [provideRouter([]), { provide: AdminAuth, useValue: { signIn: (email: string, password: string) => signIn(email, password) } }]
    }).compileComponents();
  });

  async function submit(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    for (const [selector, value] of [['#email', ' admin@example.com '], ['#password', 'secret']]) {
      const input = element.querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    return element;
  }

  it('should open the admin panel after signing in', async () => {
    const calls: string[][] = [];
    signIn = async (email, password) => void calls.push([email, password]);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await submit();
    expect(calls).toEqual([['admin@example.com', 'secret']]);
    expect(navigate).toHaveBeenCalledWith('/admin');
  });

  it('should explain when the account is not an admin', async () => {
    signIn = async () => { throw new NotAdminError(); };
    expect((await submit()).querySelector('.form-error')?.textContent).toContain('does not have admin access');
  });

  it('should report a wrong email or password', async () => {
    signIn = async () => { throw new FirebaseError('auth/invalid-credential', 'Firebase: Error (auth/invalid-credential).'); };
    expect((await submit()).querySelector('.form-error')?.textContent).toContain('Incorrect email or password.');
  });
});
