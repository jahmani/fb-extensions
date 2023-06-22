import { Injectable, inject } from '@angular/core';
import { WithId } from '@store-app-repository/app-models';
import {
  LasyFirestoreProviderService,
  environmentToken,
} from './lasy-firestore-provider-service';
import { docSnapshots, collectionSnapshots } from '@angular/fire/firestore';
import {
  Firestore,
  doc,
  QueryConstraint,
  collection,
  DocumentData,
  query,
  CollectionReference,
  Query,
  DocumentSnapshot,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from 'firebase/firestore';
import {
  Observable,
  firstValueFrom,
  switchMap,
  tap,
  map,
  catchError,
  throwError,
  from,
} from 'rxjs';
import { FirebaseloggerService } from './firebaselogger.service';

// function snapshotToDataObject<T>(docChange: DocumentSnapshot<DocumentData>) {
//   const data = docChange.data();
//   // when a doc is deleted, it will be temporary locally undefined till synced with server
//   if (data) {
//     data['ext'] = { meta: docChange.metadata };
//   }
//   return data as T;
// }
// export function sort<T>(value: T[], field: string, asc = true) {
//   if (asc) {
//     return value.sort(
//       (a, b) =>
//         (a[field]?.seconds || Number.MAX_SAFE_INTEGER) -
//         (b[field]?.seconds || Number.MAX_SAFE_INTEGER)
//     );
//   } else {
//     return value.sort(
//       (b, a) =>
//         (a[field]?.seconds || Number.MAX_SAFE_INTEGER) -
//         (b[field]?.seconds || Number.MAX_SAFE_INTEGER)
//     );
//   }
// }

@Injectable({
  providedIn: 'root',
})
export abstract class WithIdFirestoreService<T extends WithId> {
  // tslint:disable-next-line: variable-name
  protected abstract _basePath: string | undefined;
  firebaseloggerService = inject(FirebaseloggerService);
  //   protected firestore = inject(Firestore);
  lasyFirestoreProviderService = inject(LasyFirestoreProviderService);
  firestore$: Observable<Firestore>;
  firestorePromise: Promise<Firestore>;
  environment = inject(environmentToken);

  withIdConverter: FirestoreDataConverter<T> = {
    toFirestore(post: T): DocumentData {
      return post;
    },
    fromFirestore(
      snapshot: QueryDocumentSnapshot,
      options: SnapshotOptions
    ): T {
      const data = snapshot?.data(options);
      return {
        ...data,
        id: snapshot.id,
        ext: { meta: snapshot.metadata },
      } as unknown as T;
    },
  };

  constructor() {
    this.firestore$ = this.lasyFirestoreProviderService.firestore$;
    this.firestorePromise = firstValueFrom(this.firestore$);
  }

  get basePath() {
    return this._basePath;
  }
  protected abstract get fullPath(): string;

  // doc$(id: string): Observable<T> {
  //     return this.firestore.doc<T>(`${this.fullPath}/${id}`)
  //     .valueChanges();
  // }
  doc$(id: string): Observable<T|undefined> {
    return from(this.collectionRef).pipe(
      switchMap((collRef) => {
        const docData = docSnapshots(doc(collRef, id));
        return docData
      })
      ,tap((d) => {
        // notify for valid network connection
        // only if have suceessfuly sync data from network not cache
        if (d && !d.metadata.fromCache) {
          this.firebaseloggerService.notifyStreamSuceed();
        }
      })
      ,map(d => d.data())
    );
    // return this.firestore$.pipe(
    //   switchMap((firestoreValue) => {
    //     return docSnapshots(doc(firestoreValue, `${this.fullPath}/${id}`)).pipe(
    //       tap((d) => {
    //         // notify for valid network connection
    //         // only if have suceessfuly sync data from network not cache
    //         if (d && !d.metadata.fromCache) {
    //           this.firebaseloggerService.notifyStreamSuceed();
    //         }
    //       }),
    //       map((d) => snapshotToDataObject<T>(d))
    //     );
    //   })
    // );
  }

  collection$(queryConstraints?: QueryConstraint[]): Observable<T[]> {
    const collRef$ = from(this.collectionRef).pipe(
      map((collRef) => {
        if (queryConstraints) {
          return query<T>(collRef, ...queryConstraints);
        }
        return collRef;
      })
    );

    const collData = collRef$.pipe(switchMap((q) => collectionSnapshots(q)));
    return collData.pipe(
      tap((d) => {
        // notify for valid network connection
        // only if have suceessfuly sync data from network not cache
        if (d.length && !d[0].metadata.fromCache) {
          this.firebaseloggerService.notifyStreamSuceed();
        }
      }),
      map((list) => {
        const dList = list
          .filter((doc) =>  !!doc)
          .map(d=> d.data())
        return dList;
        // return sort<T>(dList, 'firstCreatedOn', asc);
      }),
      catchError((err) => {
        console.log(`error streaming at [${this._basePath}] [collection$]`);
        return throwError(err);
      }),
      tap((r) => {
        if (!this.environment.production) {
          console.groupCollapsed(
            `Firestore Streaming [${this.fullPath}] [collection$]`
          );
          console.table(r);
          console.groupEnd();
        }
      })
    );
  }

  // collection$(queryFn?: QueryFn, asc = true): Observable<T[]> {
  //     let coll: AngularFirestoreCollection<T>;
  //     if (queryFn) {
  //         coll =  this.firestore.collection<T>(`${this.fullPath}`, queryFn);
  //     } else {
  //         coll =  this.firestore.collection<T>(`${this.fullPath}`);

  //     }
  //     return coll.snapshotChanges().pipe(
  //         map(list => {
  //         const dList = list.map((docChange) => this.snapshotToDataObject(docChange));
  //         return this.sort(dList, 'firstCreatedOn', asc);
  //     }
  //     ),
  //     catchError(err => {
  //         console.log(`error streaming at [${this._basePath}] [collection$]`);
  //         return throwError(err);
  //     }),
  //         tap(r => {
  //             if (!environment.production) {
  //                 console.groupCollapsed(`Firestore Streaming [${this.fullPath}] [collection$]`);
  //                 console.table(r);
  //                 console.groupEnd();
  //             }
  //         }));
  // }

  async create(value: T, id?: string) {
    const { withIdCreate } = await import(
      /* webpackMode: "lazy" */ './lasy-crud-functions/with-id-create'
    );
    return withIdCreate(this.collectionRef, value, id);
  }

  async update(value: Partial<T>) {
    const { withIdUpdate } = await import(
      './lasy-crud-functions/with-id-update'
    );
    return withIdUpdate(this.collectionRef, value);
    // const updatedDocRef = doc(this.collectionRef, value.id)
    // const id = value.id;
    // const withId: WithId = {
    //     //      firstCreatedOn: FieldValue.serverTimestamp(),
    //     id,
    // };
    // const {ext, ...trimmed} = value;
    // const updated =  Object.assign({}, trimmed, withId) as any;

    // return updateDoc(updatedDocRef, updated).then(_ => {
    //     if (!environment.production) {
    //         console.groupCollapsed(`Firestore Service [${this._basePath}] [update]`);
    //         console.log('[Id]', id, value);
    //         console.groupEnd();
    //     }
    // });
  }
  // export function withIdCreate< T extends WithId>(collectionRef: CollectionReference, value: T, id?: string) {

  //     const newDocRef = id ? doc(collectionRef, id) : doc(this.collectionRef)
  //     id = newDocRef.id;
  //     const withId: WithId = {
  //         id,
  //     };
  //     const {ext, ...trimmed} = value;

  //     return setDoc(newDocRef, Object.assign({}, trimmed, withId)).then(_ => {
  //         if (!environment.production) {
  //             console.groupCollapsed(`Firestore Service [${this._basePath}] [create]`);
  //             console.log('[Id]', id, value);
  //             console.groupEnd();
  //         }
  //     });
  // }
  // set(value: Partial<T>) {
  //     const id = value.id;
  //     const updatedDocRef = doc(this.collectionRef, value.id)

  //     const withId: WithId = {
  //         //      firstCreatedOn: FieldValue.serverTimestamp(),
  //         id,
  //     };
  //     const {ext, ...trimmed} = value;

  //     return setDoc(updatedDocRef, Object.assign({}, trimmed, withId)).then(_ => {
  //         if (!environment.production) {
  //             console.groupCollapsed(`Firestore Service [${this._basePath}] [update]`);
  //             console.log('[Id]', id, value);
  //             console.groupEnd();
  //         }
  //     });
  // }

  async delete(id: string) {
    const { appDocDelete } = await import(
      './lasy-crud-functions/app-doc-delete'
    );
    return appDocDelete(this.collectionRef, id);
    // const deletedDocRef = doc(this.collectionRef, id)

    // return deleteDoc(deletedDocRef).then(_ => {
    //     if (!environment.production) {
    //         console.groupCollapsed(`Firestore Service [${this._basePath}] [delete]`);
    //         console.log('[Id]', id);
    //         console.groupEnd();
    //     }
    // });
  }

  public get collectionRef() {
    return this.firestorePromise.then((firestoreValue) => {
      return collection(firestoreValue, `${this.fullPath}`).withConverter(
        this.withIdConverter
      );
    });
  }
}
