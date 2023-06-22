import { CollectionReference, deleteDoc, doc } from "@angular/fire/firestore";
import { Environment } from "../lasy-firestore-provider-service";

export async function appDocDelete(collectionRefP: Promise<CollectionReference> ,id: string, environment?: Environment) {
    const collectionRef = await collectionRefP;

    const deletedDocRef = doc(collectionRef, id)

    return deleteDoc(deletedDocRef).then(() => {
        if (environment && !environment.production) {
            console.groupCollapsed(`Firestore Service [${collectionRef.id}] [delete]`);
            console.log('[Id]', id);
            console.groupEnd();
        }
    });
}
