"use strict";


import * as functions from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
const firestore = getFirestore();

export const updateImageReferences = functions.firestore
    .document('stores/{storeId}/galleries/default/products/{productId}')
    .onWrite(async (change, context) => {
    const updatedProduct = change.after.exists ? change.after.data() : null;
    const previousProduct = change.before.exists ? change.before.data() : null;
    const storeId = context.params.storeId;
    const productId = context.params.productId;
    const storeRef = firestore.collection('stores').doc(storeId);
    const updatedImageURLs = (updatedProduct ? updatedProduct.images || [] : []);
    const previousImageURLs = (previousProduct ? previousProduct.images || [] : []);
    console.info('updatedImageURLs', updatedImageURLs)
    const addedImageURLs = updatedImageURLs.filter((url: string) => !previousImageURLs.includes(url));
    const removedImageURLs = previousImageURLs.filter((url: string) => !updatedImageURLs.includes(url));
    const batch = firestore.batch();
    for (const addedURL of addedImageURLs) {
        const imageId = getImageIdFromURL(addedURL);
        const imageDocRef = storeRef.collection('productPhotos').doc(imageId);
        console.info("imageDocRef", imageDocRef.path)
        imageDocRef.update( {
            refCount: FieldValue.increment(1),
            linkedProducts: FieldValue.arrayUnion(productId),
        });
    }
    for (const removedURL of removedImageURLs) {
        const imageId = getImageIdFromURL(removedURL);
        const imageDocRef = storeRef.collection('productPhotos').doc(imageId);
        batch.update(imageDocRef, {
            refCount: FieldValue.increment(-1),
            linkedProducts: FieldValue.arrayRemove(productId),
        });
    }
    await batch.commit();
    console.log(`Updated image references for product: ${productId}`);
});
function getImageIdFromURL(downloadUrl: string) {
    // Extract the image ID from the imageURL
    // const parts = imageURL.split('/');
    // return parts[parts.length - 1];

    // const fileName = downloadUrl.split('?')[0].split('/').pop();
    const decodedUrl = decodeURIComponent(downloadUrl);
    console.log("decodedUrl", decodedUrl); // my-file

    const fileName = decodedUrl.split('/').pop()?.split('?')[0];


console.log("fileNameWithoutExtension LLLLLLLL", fileName); // my-file
return fileName || "";
}
//# sourceMappingURL=onProductWrite.js.map