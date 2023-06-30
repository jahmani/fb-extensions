import { Auth } from '@angular/fire/auth';
import {
  CollectionReference,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { Editable } from '@store-app-repository/app-models';
// import { withIdUpdate } from "./update";

export async function appEditableDocUpdate<T extends Editable>(
  collectionRef: Promise<CollectionReference>,
  auth: Auth,
  value: T
) {
  const id = value.id;
  // if (auth && auth.currentUser) {
  //   const user = await auth.currentUser;
  //   const uId = user.uid;
    const editable: Partial<Editable> = {
      id,
      lastEditedOn: serverTimestamp() as Timestamp,
      lastEditedByUserId: 'uId',
    };
    const { withIdUpdate } = await import('./with-id-update');
    return withIdUpdate(collectionRef, Object.assign({}, value, editable));
  // } else {
  //   throw new Error('auth parameter is required');
  // }
}
