import { Injectable, inject } from '@angular/core';
import { Product, tagsArrayToTagsObj, tagsObjectToTagsArray } from '@store-app-repository/app-models';
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

  override toFirestore(product: PartialWithFieldValue<Product>): DocumentData {
    const res = super.toFirestore(product);
    const tagsArray = (product as Product).tags;
    const tagsObj = tagsArrayToTagsObj(tagsArray);
    if (tagsObj) {
      res['tags'] = tagsObj;
    }
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
    toFirestore: this.toFirestore,
    fromFirestore: this.fromFirestore,
  };

  constructor() {
    super();
  }
}


