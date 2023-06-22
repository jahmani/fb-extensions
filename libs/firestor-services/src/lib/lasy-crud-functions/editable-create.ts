import { Auth } from '@angular/fire/auth';
import {
  CollectionReference,
  doc,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { Editable } from '@store-app-repository/app-models';
// import { withIdCreate } from "./with-id-create";

export async function appEditableDocCreate<T extends Editable>(
  collectionRef: Promise<CollectionReference>,
  auth: Auth,
  value: T,
  id?: string
) {
  if (auth && auth.currentUser) {
    if (!id) {
      const newDocRef = doc(await collectionRef);
      id = newDocRef.id;
    }
    const user = await auth.currentUser;
    const uId = user.uid;
    const editable: Editable = {
      firstCreatedOn: serverTimestamp() as Timestamp,
      id,
      lastEditedOn: serverTimestamp() as Timestamp,
      lastEditedByUserId: uId,
    };
    // let path = "./with-id-create";
    // path = path.replace('+','-')
    // console.log(path);
    const { withIdCreate } = await import(
      /* webpackMode: "lazy" */ './with-id-create'
    );
    return withIdCreate(collectionRef, Object.assign({}, value, editable), id);
  }
  throw new Error('auth parameter is required');
}
