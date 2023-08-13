import {  inject } from '@angular/core';
import { WithId } from '@store-app-repository/app-models';
import {
  LasyFirestoreProviderService,
  environmentToken,
} from './lasy-firestore-provider-service';
import { docSnapshots, collectionSnapshots, startAfter, getDocFromCache } from '@angular/fire/firestore';
import {
  Firestore,
  doc,
  QueryConstraint,
  collection,
  DocumentData,
  query,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  CollectionReference,
  limit,
  DocumentSnapshot,
  getCountFromServer,
  getDocsFromCache,
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
  shareReplay,
  startWith,
  concat,
  concatAll,
  concatWith,
} from 'rxjs';
import { FirebaseloggerService } from './firebaselogger.service';


export abstract class WithIdFirestoreService<T extends WithId> {
  // tslint:disable-next-line: variable-name
  protected abstract _basePath: string | undefined;
  firebaseloggerService = inject(FirebaseloggerService);
  //   protected firestore = inject(Firestore);
  lasyFirestoreProviderService = inject(LasyFirestoreProviderService);
  firestore$: Observable<Firestore>;
  firestorePromise: Promise<Firestore>;
  environment = inject(environmentToken, {optional: true});

  private withIdConverter: FirestoreDataConverter<T> = {
    toFirestore(post: T): DocumentData {
      return post;
    },
    fromFirestore(
      snapshot: QueryDocumentSnapshot,
      options: SnapshotOptions
    ): T {
      const data = snapshot?.data(options);
      const res = {
        ...data,
        id: snapshot.id,
        ext: { meta: snapshot.metadata },
      };
      return res as unknown as T;
    },
  };

  getNewDocId(){
    return this.collectionRef.then((cr)=>{
      return doc(cr).id
    })
  }
  fbConvertor = this.withIdConverter;
  collectionRef: Promise<CollectionReference<T>>;
  lastDoc: QueryDocumentSnapshot<T> | undefined;
  currentQueryConstraints: QueryConstraint[] | undefined;

  constructor() {
    this.firestore$ = this.lasyFirestoreProviderService.firestore$;
    this.firestorePromise = firstValueFrom(this.firestore$);
    this.collectionRef = this.getCollectionRef();
  }

  get basePath() {
    return this._basePath;
  }
  protected abstract get fullPath(): string;

  // doc$(id: string): Observable<T> {
  //     return this.firestore.doc<T>(`${this.fullPath}/${id}`)
  //     .valueChanges();
  // }
  doc$(id: string): Observable<T | undefined> {
    return from(this.collectionRef).pipe(
      switchMap((collRef) => {
        const docData = docSnapshots(doc(collRef, id));
        return docData;
      }),
      tap((d) => {
        // notify for valid network connection
        // only if have suceessfuly sync data from network not cache
        if (d && !d.metadata.fromCache) {
          this.firebaseloggerService.notifyStreamSuceed();
        }
      }),
      map((d) => d.data())
    );
  }

  getDocCount(    queryConstraints?: QueryConstraint[]    ){
    const docsCount$ = from(this.collectionRef).pipe(
      map((collRef) => {
          let queryFn ;
          if (queryConstraints) {
            queryFn =  query<T>(collRef, ...queryConstraints)
          } else {
            queryFn =  query<T>(collRef)
          }
          return queryFn;
        }
      ), switchMap((v=>{
        return getCountFromServer(v)
      })), map(docCount=> 
        docCount.data().count));

      return docsCount$;
      
  }

  getAllDocs$(){
    return this.getDocs$();
  }
  getQueryedDocs$(    queryConstraints?: QueryConstraint[],
    docLimit?: number){
      if (queryConstraints) {
        this.currentQueryConstraints = queryConstraints;

      }
      return this.getDocs$(queryConstraints,undefined, docLimit)
  }
  getMoreDocs$( docLimit?: number){
      return this.getDocs$(this.currentQueryConstraints,this.lastDoc, docLimit)
  }

  private getDocs$(
    queryConstraints?: QueryConstraint[],
    startAfterDoc?: DocumentSnapshot,
    docLimit?: number
  ): Observable<T[]> {
     
    const collRef$ = from(this.collectionRef).pipe(
      map((collRef) => {
          let queryFn ;
          if (queryConstraints) {
            queryFn =  query<T>(collRef, ...queryConstraints)
          } else {
            queryFn =  query<T>(collRef)
          }
          if(startAfterDoc){
            queryFn = query(queryFn, startAfter(startAfterDoc));
          }
          if (docLimit) {
            queryFn = query(queryFn, limit(docLimit));
          }
          return queryFn;
        })
    )

    const collData = collRef$.pipe(switchMap((q) => {
      // const docsFromCach =from(getDocsFromCache(q)).pipe(map(d=>d.docs), tap((r=>{
      //   console.log("resultsFromCache", r)
      // })));

       const qS = collectionSnapshots(q).pipe()

      // return docsFromCach.pipe(concatWith(qS));
      return qS
    }));
    return collData.pipe(
      tap((d) => {
        // notify for valid network connection
        // only if have suceessfuly sync data from network not cache
        if (d.length && !d[0].metadata.fromCache) {
          this.firebaseloggerService.notifyStreamSuceed();
        }
        if (d.length > 0) {
          this.lastDoc = d[d.length - 1];  // Get the last document
      }
      }),
      map((list) => {
        const dList = list.filter((doc) => !!doc).map((d) => d.data());
        return dList;
        // return sort<T>(dList, 'firstCreatedOn', asc);
      }),
      shareReplay({bufferSize:1, refCount:true}),
      catchError((err) => {
        console.log(`error streaming at [${this._basePath}] [collection$]`);
        return throwError(err);
      }),
      tap((r) => {
        if (!this.environment?.production) {
          console.groupCollapsed(
            `Firestore Streaming [${this.fullPath}] [collection$]`
          );
          console.table(r);
          console.groupEnd();
        }
      })
    );
  }



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
  }

  async delete(id: string) {
    const { appDocDelete } = await import(
      './lasy-crud-functions/app-doc-delete'
    );
    return appDocDelete(this.collectionRef, id);
  }

  public getCollectionRef() {
    return this.firestorePromise.then((firestoreValue) => {
      return collection(firestoreValue, `${this.fullPath}`).withConverter(
        this.fbConvertor
      );
    });
  }
}
