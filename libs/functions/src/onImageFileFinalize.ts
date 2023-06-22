"use strict";

import functions = require("firebase-functions");
import admin = require("firebase-admin");
const firestore = admin.firestore();
export const createImageDocument = functions.storage.object().onFinalize(async (object) => {
    const { name, contentType, size, metadata, } = object;
    if (metadata?.resizedImage){
      return;
    }
    const photPath = name!.replace('paroducts', 'productsPhotos');
    console.log("object metadata: ", object)
    const imageDocRef = firestore.doc(photPath || "u");
    const imageData = {
        downloadUrl: `gs://${object.bucket}/${name}`,
        contentType,
        size,
        metadata,
        refCount: 0,
        linkedProducts: [],
    };
    await imageDocRef.set(imageData);
    console.log(`Image document created: ${name}`);
});
//# sourceMappingURL=onImageFileFinalize.js.map