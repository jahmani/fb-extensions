import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { importProvidersFrom, inject } from '@angular/core';
import { AppComponent } from './app/app.component';
import { connectStorageEmulator } from 'firebase/storage';
import { provideStorage, getStorage } from '@angular/fire/storage';
import {
  provideFunctions,
  getFunctions,
  connectFunctionsEmulator,
} from '@angular/fire/functions';
import {
  provideFirestore,
  getFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from '@angular/fire/firestore';
import { connectAuthEmulator } from 'firebase/auth';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from './environments/environment';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { IonicRouteStrategy, IonicModule } from '@ionic/angular';
import { RouteReuseStrategy } from '@angular/router';
import { environmentToken } from '@store-app-repository/firestor-services';

// const useEmulators = false && !environment.production && environment.useEmulators;

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide:environmentToken,
      useValue:{
        useEmulators : environment.useEmulators,
      }
    },
    importProvidersFrom(
      BrowserModule,
      IonicModule.forRoot(),
      AppRoutingModule,
      provideFirebaseApp(() => initializeApp(environment.firebase)),
      provideAuth(() => {
        const auth = getAuth();
        if (inject(environmentToken).useEmulator) {
          connectAuthEmulator(auth, 'http://localhost:9099');
        }
        return auth;
      }),
      // provideFirestore(() => {
      //   const firestore = getFirestore();
      //   // enableIndexedDbPersistence(firestore);
      //   if (inject(environmentToken).useEmulator) {
      //     connectFirestoreEmulator(firestore, 'localhost', 8080);
      //   }
      //   return firestore;
      // }),
      provideFunctions(() => {
        const functions = getFunctions();
        if (inject(environmentToken).useEmulator) {
          connectFunctionsEmulator(functions, 'localhost', 5001);
        }
        return functions;
      }),
      provideStorage(() => {
        const stoarge = getStorage();
        if (inject(environmentToken).useEmulator) {

        connectStorageEmulator(stoarge, 'localhost', 9199);
        }
        return stoarge;
      })
    ),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
}).catch((err) => console.error(err));
