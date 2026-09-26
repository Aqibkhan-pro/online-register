import { EnvironmentProviders, InjectionToken, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase web config is a public identifier, not a secret; data access is controlled by Firebase Security Rules.
const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyCufvF2HLCD2DQ6y4_Mz4vc_GIVbIPfU8c',
  authDomain: 'online-register-64832.firebaseapp.com',
  projectId: 'online-register-64832',
  storageBucket: 'online-register-64832.firebasestorage.app',
  messagingSenderId: '293570951594',
  appId: '1:293570951594:web:81e99ba40ef780f58a53d3',
  measurementId: 'G-WV98DBW2MN'
};

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');

export function provideFirebase(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: FIREBASE_APP, useFactory: () => initializeApp(firebaseConfig) },
    provideAppInitializer(() => {
      const app = inject(FIREBASE_APP);
      // Analytics needs browser-only APIs (cookies, IndexedDB), so enable it without blocking app startup.
      void isSupported().then((supported) => supported && getAnalytics(app));
    })
  ]);
}
