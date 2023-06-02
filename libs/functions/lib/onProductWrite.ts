"use strict";

const { arrayUnion, increment } = require("firebase/firestore");

exports.updateImageReferences = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firestore = admin.firestore();
exports.updateImageReferences = functions.firestore
    .document('stores/{storeId}/products/{productId}')
    .onWrite(async (change, context) => {
    const updatedProduct = change.after.exists ? change.after.data() : null;
    const previousProduct = change.before.exists ? change.before.data() : null;
    const storeId = context.params.storeId;
    const productId = context.params.productId;
    const storeRef = firestore.collection('stores').doc(storeId);
    const updatedImageURLs = (updatedProduct ? updatedProduct.images || [] : []);
    const previousImageURLs = (previousProduct ? previousProduct.images || [] : []);
    console.info('updatedImageURLs', updatedImageURLs)
    const addedImageURLs = updatedImageURLs.filter(url => !previousImageURLs.includes(url));
    const removedImageURLs = previousImageURLs.filter(url => !updatedImageURLs.includes(url));
    const batch = firestore.batch();
    for (const addedURL of addedImageURLs) {
        const imageId = getImageIdFromURL(addedURL);
        const imageDocRef = storeRef.collection('productPhotos').doc(imageId);
        batch.update(imageDocRef, {
            refCount: increment(1),
            linkedProducts: arrayUnion(productId),
        });
    }
    for (const removedURL of removedImageURLs) {
        const imageId = getImageIdFromURL(removedURL);
        const imageDocRef = storeRef.collection('Images').doc(imageId);
        batch.update(imageDocRef, {
            refCount:increment(-1),
            linkedProducts: arrayRemove(productId),
        });
    }
    await batch.commit();
    console.log(`Updated image references for product: ${productId}`);
});
function getImageIdFromURL(imageURL) {
    // Extract the image ID from the imageURL
    const parts = imageURL.split('/');
    return parts[parts.length - 1];
}
//# sourceMappingURL=onProductWrite.js.map