import { Injectable } from '@angular/core';
import { onLog } from '@angular/fire/app';
import {
  BehaviorSubject,
  skip,
  map,
  filter,
  merge,
  distinctUntilChanged,
  tap,
  of,
  fromEvent,
  combineLatest,
  shareReplay,
} from 'rxjs';

// declare type again LogLevelString since i cant find any way to import it from '@angular/fire/
declare type LogLevelString =
  | 'debug'
  | 'verbose'
  | 'info'
  | 'warn'
  | 'error'
  | 'silent';
// declare type again LogCallbackParams since i cant find any way to import it from '@angular/fire/
interface LogCallbackParams {
  level: LogLevelString;
  message: string;
  args: unknown[];
  type: string;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseloggerService {
  private readonly logSubject = new BehaviorSubject<LogCallbackParams | null>(
    null
  );
  private readonly firestoreStreemSucceedSubject = new BehaviorSubject<boolean>(
    true
  );
  private readonly firestoreStreemSucceed =
    this.firestoreStreemSucceedSubject.asObservable();

  private readonly log$ = this.logSubject.asObservable().pipe(skip(1));
  private readonly networkLostLog$ = this.log$.pipe(
    map(this.isNetworkError),
    filter((b) => b || false),
    map((b) => !b)
  );

  private readonly firestoreConnectionStatus = merge(
    this.networkLostLog$,
    this.firestoreStreemSucceed
  ).pipe(
    distinctUntilChanged(),
    tap((status) => console.log('firestoreConnectionStatus', status))
  );
  private readonly navgatorNetworkStatus$ = merge(
    of(null),
    fromEvent(window, 'online'),
    fromEvent(window, 'offline')
  ).pipe(
    map(() => navigator.onLine),
    tap((navigatorConnectionStatrus) =>
      console.log('navigatorConnectionStatrus', navigatorConnectionStatrus)
    )
  );
  readonly realNetworkStatus = combineLatest([
    this.firestoreConnectionStatus,
    this.navgatorNetworkStatus$,
  ]).pipe(
    map(([firestoreConnectionStatus, networkStatus]) => {
      return networkStatus && firestoreConnectionStatus;
    }), distinctUntilChanged(), shareReplay(1)
  );
  constructor() {
    console.log('callBackParams');
    // this.realNetworkStatus.subscribe((networkLost)=> console.log("network connected: ", networkLost));
    this.regesterLogger();
  }
  private isNetworkError(callbackParam: LogCallbackParams | null): boolean| null {
    return (
      callbackParam &&
      (callbackParam.message.indexOf('Could not reach Cloud Firestore') >= 0 ||
        callbackParam.message.indexOf(
          'Connection WebChannel transport errored'
        ) >= 0)
    );
  }

  regesterLogger() {
    onLog(
      (callBackParams) => {
        console.log('callBackParams', callBackParams);
        this.logSubject.next(callBackParams);
      },
      { level: 'info' }
    );
  }

  notifyStreamSuceed() {
    this.firestoreStreemSucceedSubject.next(true);
  }
  notifyStreamFailed() {
    this.firestoreStreemSucceedSubject.next(false);
  }
}
