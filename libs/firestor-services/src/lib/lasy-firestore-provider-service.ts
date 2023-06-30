import { Injectable, InjectionToken, inject } from '@angular/core';
import { getApp } from '@angular/fire/app';
import type { Firestore } from '@angular/fire/firestore';
import { Observable, from, tap, map, shareReplay } from 'rxjs';

export interface Environment {
  useEmulator: boolean;
  production: boolean;
}
export const environmentToken = new InjectionToken<Environment>('environment', {
  factory: () => {
    return { useEmulator: false, production: false };
  },
});

@Injectable({
  providedIn: 'root',
})
export class LasyFirestoreProviderService {
  readonly firestore$: Observable<Firestore>;
  private _firestoreInstance: Firestore | null = null;

  get firestoreInstance() {
    return this._firestoreInstance;
  }
  // firestorePromise: Promise<Firestore>;
  // loader: any;
  constructor() {
    const useEmulator = inject(environmentToken, {
      optional: true,
    })?.useEmulator;
    this.firestore$ = from(import('./rexportGetFirestore')).pipe(
      tap(() =>
        console.log(
          './rexportGetFirestore get imported oncecccccccccccccccccccccccccccccccc'
        )
      ),
      map(
        ({
          initializeFirestore,
          connectFirestoreEmulator,
          persistentLocalCache,
        }) => {
          // const firestore = getFirestore();
          const app = getApp();
          const firestore = initializeFirestore(app, {
            localCache: persistentLocalCache(/*settings*/ {}),
          });

          // enableIndexedDbPersistence(firestore);
          console.log('useEmulator : ', useEmulator);
          if (useEmulator) {
            connectFirestoreEmulator(firestore, 'localhost', 8080);
          }
          return firestore;
        }
      ),
      shareReplay(),
      tap((firestoreInstance) => (this._firestoreInstance = firestoreInstance))
    );
  }

  // async getFirestoreInstance(){
  //   this.loader ??= await import('./rexportGetFirestore')
  //   this.firestoreInstance ??= this.loader.getFirestore();
  //   return this.firestoreInstance;
  // }
}