import { Injectable, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { User } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore/lite';
import { FIREBASE_APP } from '../firebase';

/** The credentials were valid, but the account has no document in the Firestore `admins` collection. */
export class NotAdminError extends Error {}

/**
 * Firebase email/password sign-in for admins. Any Firebase account can sign in, so an account only counts as an
 * admin when `admins/{uid}` exists in Firestore; the Firestore rules apply the same check to every write.
 */
@Injectable({ providedIn: 'root' })
export class AdminAuth {
  private readonly app = inject(FIREBASE_APP);
  private readonly db = getFirestore(this.app);
  // Firebase Auth is imported after startup so it doesn't weigh down the public verification page.
  private readonly lib = import('firebase/auth');
  private readonly auth = this.lib.then(({ initializeAuth, indexedDBLocalPersistence, browserLocalPersistence }) =>
    // initializeAuth (unlike getAuth) leaves out the popup/redirect sign-in code this app doesn't use.
    initializeAuth(this.app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] })
  );

  /** undefined until Firebase has restored any saved session on startup. */
  readonly user = signal<User | null | undefined>(undefined);
  readonly isAdmin = signal(false);
  /** Resolves once the saved session (if any) has been restored and checked. */
  readonly ready: Promise<void>;

  constructor() {
    let markReady!: () => void;
    this.ready = new Promise((resolve) => (markReady = resolve));
    void Promise.all([this.auth, this.lib]).then(([auth, { onAuthStateChanged }]) =>
      onAuthStateChanged(auth, async (user) => {
        const isAdmin = user ? await this.checkAdmin(user).catch(() => false) : false;
        // Ignore a check that finished after the user had already changed again (e.g. signed out meanwhile).
        if (auth.currentUser !== user) return;
        this.isAdmin.set(isAdmin);
        this.user.set(user);
        markReady();
      })
    );
  }

  /** Signs in and verifies admin access; non-admin accounts are signed straight back out. */
  async signIn(email: string, password: string): Promise<void> {
    const [auth, { signInWithEmailAndPassword, signOut }] = await Promise.all([this.auth, this.lib]);
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    let isAdmin: boolean;
    try {
      isAdmin = await this.checkAdmin(user);
    } catch (error) {
      await signOut(auth);
      throw error;
    }
    if (!isAdmin) {
      await signOut(auth);
      throw new NotAdminError('This account is not an admin.');
    }
    // Set now rather than waiting for onAuthStateChanged, so the admin guard passes on the navigation that follows.
    this.user.set(user);
    this.isAdmin.set(true);
  }

  async signOut(): Promise<void> {
    const [auth, { signOut }] = await Promise.all([this.auth, this.lib]);
    await signOut(auth);
  }

  private async checkAdmin(user: User): Promise<boolean> {
    return (await getDoc(doc(this.db, 'admins', user.uid))).exists();
  }
}

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AdminAuth);
  const router = inject(Router);
  await auth.ready;
  return auth.isAdmin() || router.parseUrl('/login');
};
