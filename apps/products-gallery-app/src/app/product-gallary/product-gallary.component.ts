import { Component, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { collection, collectionData, DocumentData, Firestore, onSnapshot } from '@angular/fire/firestore';
import { storeIdToken } from '../app-routing.module';
import { Product } from '@store-app-repository/app-models';
import { Observable, map } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ProductsDataService } from '../dataServices/products-data.service';


@Component({
  selector: 'store-app-repository-product-gallary',
  standalone: true,
  imports: [CommonModule, IonicModule, ScrollingModule, NgOptimizedImage],
  templateUrl: './product-gallary.component.html',
  styleUrls: ['./product-gallary.component.scss'],
})
export class ProductGallaryComponent {
  // private firestore: Firestore = inject(Firestore)
  storeId = inject(storeIdToken);
  private productsService = inject(ProductsDataService);
  products$: Observable<Product[]>;
  ;
  constructor(){
    // const productsCollection = collection(this.firestore,`stores/${this.storeId}/galleries/default/products` );
    // this.products$ = collectionData(productsCollection) as Observable<Product[]>;
    this.products$ = this.productsService.getAllDocs$();

  }

  getthumbUrl(imgId: string){
    const BUCKET_NAME = 'store-gallary.appspot.com';
    const OBJECT_NAME = `stores/${this.storeId}/productPhotos/thumbs/${imgId}_150x150.jpeg`
    const url = `https://storage.googleapis.com/${BUCKET_NAME}/${OBJECT_NAME}`
    console.log("url: ", url)
    return url;
  }
  }


