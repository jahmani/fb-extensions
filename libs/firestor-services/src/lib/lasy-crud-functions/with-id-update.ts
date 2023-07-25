import { CollectionReference, doc, updateDoc } from "@angular/fire/firestore";
import { WithId } from "@store-app-repository/app-models";
import { Environment } from "../lasy-firestore-provider-service";

export async function withIdUpdate<T extends WithId>(collectionRefP: Promise<CollectionReference>, value: Partial<T>, environment?: Environment) {
    const collectionRef = await collectionRefP;
    const updatedDocRef = doc(collectionRef, value.id)
    // const id = value.id;
    // const withId = {
    //     //      firstCreatedOn: FieldValue.serverTimestamp(),
    //     id,
    // };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {ext, id, ...trimmed} = value;
    const updated =  Object.assign({}, trimmed) ;

    return updateDoc(updatedDocRef, updated).then(()=> {
        if (environment && !environment.production) {
            console.groupCollapsed(`Firestore Service [${collectionRef.id}] [update]`);
            console.log('[Id]', id, value);
            console.groupEnd();
        }
    });
}