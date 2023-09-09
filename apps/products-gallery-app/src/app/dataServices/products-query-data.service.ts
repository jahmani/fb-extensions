import { Injectable, inject } from '@angular/core';
import {
  AndCompositeQuery,
  OrCompositeQuery,
  productGallaryQuery,
} from '@store-app-repository/app-models';
import { EditableFirestoreService } from '@store-app-repository/firestor-services';
import { storeIdToken, productGalleryIdToken } from '../app.routes';
import {
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'any',
})
export class ProductsQueryDataService extends EditableFirestoreService<productGallaryQuery> {
  storeId = inject(storeIdToken);
  photoGalaryId =
    inject(productGalleryIdToken, { optional: true }) || 'default';
  override _basePath = `stores/${this.storeId}/galleries/${this.photoGalaryId}/queries`;

  toFirestore2(q: productGallaryQuery): DocumentData {
    console.log('query: ', q);
    const flatArray = q.query.map((qa) => {
      return { subQuery: qa };
    }) as unknown as OrCompositeQuery;
    const res = super.toFirestore({ ...q, query: flatArray });
    return res;
  }

  override fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options: SnapshotOptions
  ): productGallaryQuery {
    const flatArray = snapshot.get('query') as {
      subQuery: AndCompositeQuery;
    }[];
    const d2Array = flatArray.map((o) => o.subQuery);
    const product = super.fromFirestore(snapshot, options);
    product.query = d2Array;
    return product;
  }

  override fbConvertor = {
    toFirestore: this.toFirestore2,
    fromFirestore: this.fromFirestore,
  };

  constructor() {
    super();
    console.log('ProductsQueryDataService');
  }
}
