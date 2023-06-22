
import { WithId } from "@store-app-repository/app-models";
import { Environment } from "../lasy-firestore-provider-service";
import { CollectionReference, doc, setDoc } from "@angular/fire/firestore";

export async function withIdCreate< T extends WithId>(collectionRefP: Promise<CollectionReference>, value: T, id?: string, environment? : Environment) {
    const collectionRef = await collectionRefP;
    const newDocRef = id ? doc(collectionRef, id) : doc(collectionRef)
    id = newDocRef.id;
    const withId = {
        id,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {ext, ...trimmed} = value;

    return setDoc(newDocRef, Object.assign({}, trimmed, withId)).then(() => {
        if (environment && !environment.production) {
            console.groupCollapsed(`Firestore Service [${collectionRef.id}] [create]`);
            console.log('[Id]', id, value);
            console.groupEnd();
        }
    });
}