import { Injectable, inject } from '@angular/core';
import { ProductGalleryUser } from '@store-app-repository/app-models';
import { EditableFirestoreService } from '@store-app-repository/firestor-services';
import { storeIdToken, productGalleryIdToken } from '../app.routes';

@Injectable({
  providedIn: 'any'
})
export class GallaryUsersDataService extends EditableFirestoreService<ProductGalleryUser> {
  storeId = inject(storeIdToken);
  photoGalaryId =
    inject(productGalleryIdToken, { optional: true }) || 'default';
    override _basePath = `stores/${this.storeId}/galleries/${this.photoGalaryId}/gallaryUsers`;
    constructor() {
      super();
     }
}
