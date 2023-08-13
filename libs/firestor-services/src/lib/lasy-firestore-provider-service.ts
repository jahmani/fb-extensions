import { Injectable, InjectionToken, inject } from '@angular/core';
import { getApp } from '@angular/fire/app';
import { disableNetwork, enableNetwork, Firestore } from '@angular/fire/firestore';
import { Observable, from, tap, map, shareReplay, first, firstValueFrom } from 'rxjs';

export interface Environment {
  useEmulator: boolean;
  production: boolean;
}
export const environmentToken = new InjectionToken<Environment>('environment', {
  factory: () => {
    return { useEmulator: false, production: false };
  },
});
export const disableNetworkPeriodToken = new InjectionToken<number>('disableNetworkPeriodToken');


@Injectable({
  providedIn: 'root',
})
export class LasyFirestoreProviderService {
  readonly firestore$: Observable<Firestore>;
  private _firestoreInstance: Firestore | null = null;
  disableNetworkPeriod= inject(disableNetworkPeriodToken, {optional:true}) || 0;

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
          const firestore =
           initializeFirestore(app, {
            localCache: persistentLocalCache(/*settings*/ {}),
          });

          if (this.disableNetworkPeriod) {
            console.log('network is enabled');

            disableNetwork(firestore).then(()=>{
              console.log('network disabled');
              setTimeout(() => {
                console.log('try to enable network');
  
                enableNetwork(firestore).then(()=>{
                  console.log('network ENabled');
  
                });
              }, this.disableNetworkPeriod);
            });

          }

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
  loadFirestore(){
    firstValueFrom(this.firestore$).then((fs)=>{
      console.log('firestore Loaded')
      return fs;
    })
  }

  // async getFirestoreInstance(){
  //   this.loader ??= await import('./rexportGetFirestore')
  //   this.firestoreInstance ??= this.loader.getFirestore();
  //   return this.firestoreInstance;
  // }
}
