import { Injectable, inject } from '@angular/core';
import { Product } from '@store-app-repository/app-models';
import { EditableFirestoreService } from '@store-app-repository/firestor-services';
import { productGalleryIdToken, storeIdToken } from '../app-routing.module';

@Injectable({
  providedIn: 'any'
})
export class ProductsDataService extends EditableFirestoreService<Product> {

  storeId = inject(storeIdToken);
  photoGalaryId = inject(productGalleryIdToken, {optional:true}) || 'default'
  override _basePath = `stores/${this.storeId}/galleries/${this.photoGalaryId}/products`

  constructor() {
    
    super();
  }
}
