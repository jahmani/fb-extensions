import { AfterViewInit, Component, ViewChild, ViewChildren, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Auth, signOut } from '@angular/fire/auth';
import { Product } from '@store-app-repository/app-models';
import {
  Observable,
  combineLatestWith,
  firstValueFrom,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { InfiniteScrollCustomEvent, IonInfiniteScroll, IonicModule } from '@ionic/angular';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ProductsDataService } from '../../dataServices/products-data.service';
import { TagsInputComponent } from '../../ui-components/TagsInput/tags-input.component';
import { WordSuggestionsDataService } from '../../dataServices/word-suggestions-data.service';
import { environmentToken } from '@store-app-repository/firestor-services';
import { QueryConstraint, where } from '@angular/fire/firestore';
import { GallaryHelperDocsDataService } from '../../dataServices/gallary-helper-docs-data.service';
import { RouterLink } from '@angular/router';
import { storeIdToken } from '../../app.routes';
import { ImgIdtoThumbUrePipe } from '../../ui-components/img-idto-thumb-ure.pipe';
import { StoreCustomPropertiesService } from '../../dataServices/store-custom-properties.service';
import { orderBy } from 'firebase/firestore';
import { HydratedImgDirective } from '../../ui-components/hydrated-img.directive';
import { FirebaseUserService } from '../../authServices/firebase-user.service';

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
    HydratedImgDirective
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
    @ViewChild(IonInfiniteScroll) infinitScroll: IonInfiniteScroll | undefined;
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
  fbAuth = inject(Auth)
  user = inject(FirebaseUserService).user
  productTags$: Observable<string[]>;
  selectedTags$: Observable<string[]> | undefined;
  productBatchsOptionValues$: Observable<string[]>;
  selectedBatchs$: Observable<string[] > | undefined;
  loaded= false;
  scrollEvents: Observable<CustomEvent<void> | 'initialLoad'> | undefined;
  ProductsInstance: Product[] =[];
  docCount$: Observable<number> | undefined;
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

      if (this.infinitScroll) {
        this.scrollEvents = this.infinitScroll.ionInfinite;
      } else{
        this.scrollEvents = of('initialLoad')
      }

      const queryConstraints$ = this.selectedWord$.pipe(
        combineLatestWith(this.selectedBatchs$),
        map(([namePrefex, selectedBatchs]) => {
          console.log('val', namePrefex, 'selectedTags: ', selectedBatchs);
          this.loaded = false;

          let q: QueryConstraint[] = [];
          if (namePrefex) {
            q = [...q, where('namePrefexes', 'array-contains' , namePrefex)];
          }
          if (selectedBatchs && selectedBatchs.length) {
              q = [...q, where('customProperties.' + 'batch', 'in', selectedBatchs)];
          }
          q = [...q, orderBy('lastEditedOn','desc')]
          return q;
        }))
        this.docCount$ = queryConstraints$.pipe(switchMap(q=>this.productsService.getDocCount(q)));

        this.products$ = queryConstraints$.pipe(switchMap(q=>{
           const queriedProducts = this.productsService.getQueryedDocs$(q,21);
          // const allParts  = [queriedProducts];
          // const allProducts = combineLatest(allParts).pipe(map(parts=>parts.flat()))
          // if (!this.infinitScroll) {
          //   return  of([]as Product[])
          // }
          // const scrollEvent = this.infinitScroll.ionInfinite.pipe(startWith("InititalLoad")) ;
          // const morProducts = scrollEvent.pipe
          // (
          //   switchMap((ev=>{
          //     if (ev === 'InititalLoad') {
          //       return this.productsService.getQueryedDocs$(q,21);
          //     } else {
          //       const isEvent =  ev as InfiniteScrollCustomEvent;
          //       isEvent.target.complete()
          //       const morProducts = this.productsService.getMoreDocs$(21);
          //       return morProducts;
          //     }

          //   }))
          // )
          // const morAndMor = morProducts.pipe(scan((acc, value, index)=>{
          //   console.log('scanIndex: ', index)
          //   // if (index%2 === 1) {
          //   //   return acc;
          //   // }
          //   if (value.length === 0 && this.infinitScroll) {
          //     this.infinitScroll.disabled = true
          //   }
          //   const concat = acc.concat(value);
          //   return concat;
          // }))
          // return morAndMor;
          return queriedProducts.pipe(tap((products)=>{
            this.loaded = true;
            this.ProductsInstance  = products;
            if (this.infinitScroll) {
              this.infinitScroll.disabled = false;
            }
          }));


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

  onInfinitScroll(ev: Event){
                   const isEvent =  ev as InfiniteScrollCustomEvent;
                isEvent.target.complete()
                const morProducts = this.productsService.getMoreDocs$(21);
                firstValueFrom(morProducts).then((more)=>{
                  if (more.length) {
                    this.ProductsInstance = this.ProductsInstance.concat(more)

                  } else {
                    isEvent.target.disabled = true;
                  }
                })

               // return morProducts;

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
  trackBy(index: number, name: Product): string {
    return name.id;
  }
  logout(){
    signOut(this.fbAuth)
  }
}
