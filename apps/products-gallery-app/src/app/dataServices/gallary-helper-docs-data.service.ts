import { Injectable, inject } from '@angular/core';
import { GallaryHelperDoc, ProductTagDoc } from '@store-app-repository/app-models';
import { EditableFirestoreService } from '@store-app-repository/firestor-services';
import { Observable } from 'rxjs';
import { storeIdToken, productGalleryIdToken } from '../app.routes';

@Injectable({
  providedIn: 'any'
})
export class GallaryHelperDocsDataService extends EditableFirestoreService<GallaryHelperDoc> {

  storeId = inject(storeIdToken);
  photoGalaryId = inject(productGalleryIdToken, {optional:true}) || 'default'
  override _basePath = `stores/${this.storeId}/galleries/${this.photoGalaryId}/gallaryHelperDocs`;
  constructor() {
    super();
  }
  getProductTags(){
    return super.doc$('productTags') as Observable<ProductTagDoc>;
  }
}