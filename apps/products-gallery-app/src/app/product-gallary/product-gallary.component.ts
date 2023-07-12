import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Product } from '@store-app-repository/app-models';
import {
  Observable,
  combineLatestWith,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ProductsDataService } from '../dataServices/products-data.service';
import { TagsInputComponent } from '../ui-components/TagsInput/tags-input.component';
import { WordSuggestionsDataService } from '../dataServices/word-suggestions-data.service';
import { environmentToken } from '@store-app-repository/firestor-services';
import { QueryConstraint, where } from '@angular/fire/firestore';
import { GallaryHelperDocsDataService } from '../dataServices/gallary-helper-docs-data.service';
import { RouterLink } from '@angular/router';
import { storeIdToken } from '../app.routes';
import { ImgIdtoThumbUrePipe } from '../ui-components/img-idto-thumb-ure.pipe';
import { StoreCustomPropertiesService } from '../dataServices/store-custom-properties.service';
import { orderBy } from 'firebase/firestore';

@Component({
  selector: 'store-app-repository-product-gallary',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ScrollingModule,
    NgOptimizedImage,
    TagsInputComponent,
    RouterLink,
    ImgIdtoThumbUrePipe,
  ],
  templateUrl: './product-gallary.component.html',
  styleUrls: ['./product-gallary.component.scss'],
})
export class ProductGallaryComponent implements AfterViewInit {
  // private firestore: Firestore = inject(Firestore)
  @ViewChild('productNameWordsInput') productNameWordsInputComponent:
    | TagsInputComponent
    | undefined;
    
    @ViewChild('productTagsInput') productTagsInputComponent:
    | TagsInputComponent
    | undefined;
    @ViewChild('productBatchsOptionValuesInput') productBatchsInputComponent:
    | TagsInputComponent
    | undefined;
  storeId = inject(storeIdToken);
  private productsService = inject(ProductsDataService);
  private suggestionsService = inject(WordSuggestionsDataService);
  gallaryHelperDocsDataService = inject(GallaryHelperDocsDataService);
  storeCustomPropertiesService = inject(StoreCustomPropertiesService);
  products$: Observable<Product[]> | undefined;

  previewProduct: Product|null = null
  suggestions: Observable<string[]> | undefined;
  selectedWord$: Observable<string> | undefined;
  environment = inject(environmentToken);
  productTags$: Observable<string[]>;
  selectedTags$: Observable<string[]> | undefined;
  productBatchsOptionValues$: Observable<string[]>;
  selectedBatchs$: Observable<string[] > | undefined;
  constructor() {
    const productTagsDoc = this.gallaryHelperDocsDataService.getProductTags();
    this.productTags$ = productTagsDoc.pipe(
      map((ptd) => {
        if (ptd) {
          return Object.keys(ptd.tags).map((key) => ptd.tags[key].tagWord);
        } else {
          return [];
        }
      })
    )
    const batchCustomOptionsDoc = this.storeCustomPropertiesService.getProductBatchsOptions();
    this.productBatchsOptionValues$ = batchCustomOptionsDoc
  }
    //  const productBatchsDoc = this.storeCustomPropertiesService.getProductBatchsOptions();
    //   this.productBatchsOptionValues$ = productBatchsDoc.pipe(
    //     map((ptd) => {
    //       const options = Object.keys(ptd?.options || {})

    //     })
    // );
  
  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    if (this.productNameWordsInputComponent) {
      this.selectedWord$ =
        this.productNameWordsInputComponent.tagsInputChange.pipe(
          map((tags) => {
            if (tags && tags.length) {
              const str = tags.join(' ');
              return str;
            } else {
              return '';
            }
          }),
          startWith('')
        );
      if (this.productTagsInputComponent) {
        this.selectedTags$ =
          this.productTagsInputComponent?.tagsInputChange.pipe(
            map((tags) => {
              if (tags && tags.length) {
                return tags;
              }
              return [];
            }),
            startWith([])
          );
      } else {
        this.selectedTags$ = of([]);
      }

      if (this.productBatchsInputComponent) {
        this.selectedBatchs$ =
          this.productBatchsInputComponent?.tagsInputChange.pipe(
            map((tags) => {
              if (tags && tags.length) {
                return tags;
              }
              return [];
            }),
            startWith([])
          );
      } else {
        this.selectedBatchs$ = of([]);
      }

      this.products$ = this.selectedWord$.pipe(
        combineLatestWith(this.selectedBatchs$),
        switchMap(([val, selectedBatchs]) => {
          console.log('val', val, 'selectedTags: ', selectedBatchs);
          //  let queriedProducts: Observable<Product[]>;
          let q: QueryConstraint[] = [];
          if (val) {
            q = [...q, where('namePrefexes', 'array-contains' , val)];

            // const nameParts = val.split(' ');
            // if (nameParts && nameParts.length) {
            //   for (let index = 0; index < nameParts.length; index++) {
            //     const namePart = nameParts[index];
            //     q = [...q, where('nameParts.' + index, '==', namePart)];
            //   }
            // }
          }
          if (selectedBatchs && selectedBatchs.length) {
            // for (let index = 0; index < selectedBatchs.length; index++) {
            //   const tag = selectedBatchs[index];
              q = [...q, where('customProperties.' + 'batch', 'in', selectedBatchs)];
            // }
          }
          q = [...q, orderBy('lastEditedOn','desc')]
          const queriedProducts = this.productsService.getQueryedDocs$(q);

          return queriedProducts;
        }),
        tap((products) => {
          console.log('products: ', products);
        })
      );
      this.suggestions = this.selectedWord$.pipe(
        switchMap((val) => {
          val = val || 'zeroWord';
          const suggestions = this.suggestionsService
            .doc$(val)
            .pipe(
              map((s) => (s ? s.suggestions.map((s) => s.suggestion) : []))
            );
          return suggestions;
        })
      );
    }
  }

  // http://127.0.0.1:9199/v0/b/store-gallary.appspot.com/o/stores%5CtHP7s3ysRD4IU45Z0j8N%5CproductPhotos%5Cthumbs%5Cvj6gyRTCersZW44VNh0O_1500x1500.jpeg?alt=media&token=597d48a7-e378-40ec-8d89-9f6f90ccf1b7
  getthumbUrl(imgId: string) {
    const BUCKET_NAME = 'store-gallary.appspot.com';
    const OBJECT_NAME = `stores/${this.storeId}/productPhotos/thumbs/${imgId}_150x150.jpeg`;
    let url: string;
    if (this.environment.useEmulator) {
      url = `http://127.0.0.1:9199/${BUCKET_NAME}/${OBJECT_NAME}`;
    } else {
      url = `https://storage.googleapis.com/${BUCKET_NAME}/${OBJECT_NAME}`;
    }
    return url;
  }
}
