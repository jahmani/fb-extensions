import { Injectable, inject } from '@angular/core';
import { ProductPhoto } from '@store-app-repository/app-models';
import { EditableFirestoreService } from '@store-app-repository/firestor-services';
import { storeIdToken } from '../app.routes';
import { Storage, ref, updateMetadata } from '@angular/fire/storage';

@Injectable({
  providedIn: 'any',
})
export class StorePhotosDataService extends EditableFirestoreService<ProductPhoto> {
  storeId = inject(storeIdToken);
  override _basePath = `stores/${this.storeId}/productPhotos`;
  storagePath = `/stores/${this.storeId}/productPhotos`;
  storageThumbsPath = `/stores/${this.storeId}/productPhotos/thumbs`;
  storage: Storage = inject(Storage);
  constructor() {
    super();
  }

  updatePhotCacheControl(photoId: string) {
    const photoPath = this.storagePath + '/' + photoId;
    const photoRef = ref(this.storage, photoPath);
    const thumbsRefs = [200, 600, 1500].map((s) => {
      const path = `${this.storageThumbsPath}/${photoId}_${s}x${s}`;
      const pathRef = ref(this.storage, path);
      return pathRef;
    });
    thumbsRefs.push(photoRef);
    const promises = thumbsRefs.map((thumbRef) =>
      updateMetadata(thumbRef, { cacheControl: 'private,max-age=2592000' })
    );
    return Promise.all(promises);
  }
}
