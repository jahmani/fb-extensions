"use strict";


import * as functions from "firebase-functions";
import { getFirestore } from "firebase-admin/firestore";
const firestore = getFirestore();

export const onNewGallaryUser = functions.firestore
    .document('stores/{storeId}/galleries/{galleryId}/gallaryUsers/{userId}')
    .onCreate(async (snap, context) => {
        const { storeId, userId } = context.params;

        // Document reference to the storeUsers collection
        const storeUserRef = firestore.collection('stores').doc(storeId).collection('storeUsers').doc(userId);

        // Check if the user already exists in the storeUsers collection
        const storeUserDoc = await storeUserRef.get();
        if (!storeUserDoc.exists) {
            // If not, add the user to the storeUsers collection
            return storeUserRef.set(snap.data());
        }

        // If the user already exists, don't do anything
        return null;
    });
