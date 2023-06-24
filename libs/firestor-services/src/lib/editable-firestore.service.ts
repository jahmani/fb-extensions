import { inject } from '@angular/core';
import { Editable } from '@store-app-repository/app-models';
import { WithIdFirestoreService } from './with-id-firestore.service';
import { Auth } from '@angular/fire/auth';
import { appEditableDocCreate } from './lasy-crud-functions/editable-create';
import { appEditableDocUpdate } from './lasy-crud-functions/editable-update';
import {
  DocumentData,
  FirestoreDataConverter,
  PartialWithFieldValue,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from '@angular/fire/firestore';

export class EditableFirestoreService<
  T extends Editable
> extends WithIdFirestoreService<T> {
  protected override _basePath: string | undefined;
  protected override get fullPath(): string {
    if (!this._basePath) {
      throw new Error('Method not implemented.');
    } else {
      return this._basePath;
    }
  }

  private editableWithIdConverter: FirestoreDataConverter<T> = {
    toFirestore(post: PartialWithFieldValue<T>): DocumentData {
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

  override fbConvertor = this.editableWithIdConverter;

  public auth: Auth;
  constructor() {
    super();
    this.auth = inject(Auth);
  }

  override async create(value: T, id?: string) {
    return appEditableDocCreate(this.collectionRef, this.auth, value, id);
    // // const newDocRef = id ? doc(this.collection, id) : doc(this.collection)
    // // id = newDocRef.id;
    // const user = await this.auth.currentUser;
    // const uId = user.uid;
    // const editable: Editable = {
    //     firstCreatedOn: serverTimestamp() as Timestamp,
    //     id,
    //     lastEditedOn: serverTimestamp() as Timestamp,
    //     lastEditedByUserId: uId
    // };
    // return super.create(Object.assign({}, value, editable), id);
  }

  override async update(value: T) {
    return appEditableDocUpdate(this.collectionRef, this.auth, value);
    // const id = value.id;
    // const user = await this.auth.currentUser;
    // const uId = user.uid;
    // const editable: Partial<Editable> = {
    //     id,
    //     lastEditedOn: serverTimestamp() as Timestamp,
    //     lastEditedByUserId: uId
    // };
    // return super.update(Object.assign({}, value, editable));
  }
}
