import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { importProvidersFrom } from '@angular/core';
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

const useEmulators = true && !environment.production && environment.useEmulators;

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      IonicModule.forRoot(),
      AppRoutingModule,
      provideFirebaseApp(() => initializeApp(environment.firebase)),
      provideAuth(() => {
        const auth = getAuth();
        if (useEmulators) {
          connectAuthEmulator(auth, 'http://localhost:9099');
        }
        return auth;
      }),
      provideFirestore(() => {
        const firestore = getFirestore();
        // enableIndexedDbPersistence(firestore);
        if (useEmulators) {
          connectFirestoreEmulator(firestore, 'localhost', 8080);
        }
        return firestore;
      }),
      provideFunctions(() => {
        const functions = getFunctions();
        if (useEmulators) {
          connectFunctionsEmulator(functions, 'localhost', 5001);
        }
        return functions;
      }),
      provideStorage(() => {
        const stoarge = getStorage();
        if (useEmulators) {

        connectStorageEmulator(stoarge, 'localhost', 9199);
        }
        return stoarge;
      })
    ),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
}).catch((err) => console.error(err));
