import { Injectable, inject } from '@angular/core';
import {
  Product,
  // tagsArrayToTagsObj,
  tagsObjectToTagsArray,
} from '@store-app-repository/app-models';
import { EditableFirestoreService } from '@store-app-repository/firestor-services';
import {
  DocumentData,
  PartialWithFieldValue,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from 'firebase/firestore';
import { storeIdToken, productGalleryIdToken } from '../app.routes';

@Injectable({
  providedIn: 'any',
})
export class ProductsDataService extends EditableFirestoreService<Product> {
  storeId = inject(storeIdToken);
  photoGalaryId =
    inject(productGalleryIdToken, { optional: true }) || 'default';
  override _basePath = `stores/${this.storeId}/galleries/${this.photoGalaryId}/products`;

  toFirestore2(product: PartialWithFieldValue<Product>): DocumentData {
    console.log('product: ', product);
    const res = super.toFirestore(product);
    return res;
  }

  override fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options: SnapshotOptions
  ): Product {
    const tagsObject = snapshot.get('tags') as { [tagWord: string]: boolean };
    const product = super.fromFirestore(snapshot, options);

    const tagsArray = tagsObjectToTagsArray(tagsObject);
    if (tagsArray) product.tags = tagsArray;
    return product;
  }

  override fbConvertor = {
    toFirestore: this.toFirestore2,
    fromFirestore: this.fromFirestore,
  };

  override update(
    value: Omit<Product, 'id' | 'firstCreatedOn'>
  ): Promise<void> {
    const res = this.toFirestore2(value) as Product;
    return super.update(res);
  }
  constructor() {
    super();
    console.log('ProductsDataService');
  }
}
