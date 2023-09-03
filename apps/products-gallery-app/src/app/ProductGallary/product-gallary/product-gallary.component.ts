import {
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  Input,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { CommonModule, NgOptimizedImage, Location } from '@angular/common';
import { Auth, signOut } from '@angular/fire/auth';
import { Product } from '@store-app-repository/app-models';
import {
  Observable,
  combineLatestWith,
  distinctUntilChanged,
  firstValueFrom,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import {
  InfiniteScrollCustomEvent,
  IonInfiniteScroll,
  IonicModule,
} from '@ionic/angular';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ProductsDataService } from '../../dataServices/products-data.service';
import { TagsInputComponent } from '../../ui-components/TagsInput/tags-input.component';
import { WordSuggestionsDataService } from '../../dataServices/word-suggestions-data.service';
import {
  FirebaseloggerService,
  environmentToken,
} from '@store-app-repository/firestor-services';
import { QueryConstraint, where } from '@angular/fire/firestore';
import { GallaryHelperDocsDataService } from '../../dataServices/gallary-helper-docs-data.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { storeIdToken } from '../../app.routes';
import { ImgIdtoThumbUrePipe } from '../../ui-components/img-idto-thumb-ure.pipe';
import { StoreCustomPropertiesService } from '../../dataServices/store-custom-properties.service';
import { orderBy } from 'firebase/firestore';
import { HydratedImgDirective } from '../../ui-components/hydrated-img.directive';
import { FirebaseUserService } from '../../authServices/firebase-user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwiperOptions, Swiper } from 'swiper/types';
import { SwipperHelperDirective } from '../../ui-components/swipper-helper.directive';
// import {A11y, Mousewheel, Navigation, Pagination} from 'swiper';

import { A11y, Mousewheel, Navigation, Pagination } from 'swiper/modules';
import { ProductImgDirective } from '../../ui-components/product-img.directive';
import { RetryImgLoadDirective } from '../../ui-components/retry-img-load.directive';

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
    HydratedImgDirective,
    RetryImgLoadDirective,
    ProductImgDirective,
    SwipperHelperDirective,
  ],
  templateUrl: './product-gallary.component.html',
  styleUrls: ['./product-gallary.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  encapsulation: ViewEncapsulation.None,
})
export class ProductGallaryComponent implements AfterViewInit {
  slideView = true;
  intialSlideIndex = 0;
  // private firestore: Firestore = inject(Firestore)
  @Input() set productId(value: string) {
    this.slideView = !!value;
    if (this.ProductsInstance) {
      this.intialSlideIndex = this.ProductsInstance.findIndex(
        (product) => product.id === value
      );
      this.config.initialSlide = this.intialSlideIndex || 0;
    }
  }
  @ViewChildren('productNameWordsInput') productNameWordsInputComponents:
    | QueryList<TagsInputComponent>
    | undefined;

  @ViewChild('productTagsInput') productTagsInputComponent:
    | TagsInputComponent
    | undefined;
  @ViewChildren('productBatchsOptionValuesInput') productBatchsInputComponent:
    | QueryList<TagsInputComponent>
    | undefined;
  @ViewChild(IonInfiniteScroll) infinitScroll: IonInfiniteScroll | undefined;
  storeId = inject(storeIdToken);
  private productsService = inject(ProductsDataService);
  private suggestionsService = inject(WordSuggestionsDataService);
  gallaryHelperDocsDataService = inject(GallaryHelperDocsDataService);
  storeCustomPropertiesService = inject(StoreCustomPropertiesService);
  products$: Observable<Product[]> | undefined;

  previewProduct: Product | null = null;
  suggestions: Observable<string[]> | undefined;
  selectedWord$: Observable<string> | undefined;
  environment = inject(environmentToken);
  fbAuth = inject(Auth);
  user = inject(FirebaseUserService).user;
  // productTags$: Observable<string[]>;
  selectedTags$: Observable<string[]> | undefined;
  productBatchsOptionValues$: Observable<string[]>;
  selectedBatchs$: Observable<string[]> | undefined;
  loaded = false;
  scrollEvents: Observable<CustomEvent<void> | 'initialLoad'> | undefined;
  ProductsInstance: Product[] = [];
  docCount$: Observable<number> | undefined;
  networkStatus$ = inject(FirebaseloggerService).realNetworkStatus;
  isFilterModalVisable = false;
  sliders: string[] = [
    'Test 1',
    'Test 2',
    'Test 3',
    'Test 4',
    'Test 5',
    'Test 6',
    'Test 7',
    'Test 8',
    'Test 9',
  ];

  public config: SwiperOptions = {
    modules: [Navigation, Pagination, A11y, Mousewheel],
    autoHeight: false,
    initialSlide: this.intialSlideIndex || 0,
    spaceBetween: 20,
    navigation: true,
    pagination: { clickable: true, dynamicBullets: true },
    slidesPerView: 1,
    centeredSlides: true,
    breakpoints: {
      400: {
        slidesPerView: 'auto',
        centeredSlides: false,
      },
    },
  };
  constructor(ar: ActivatedRoute, private location: Location) {
    console.log('products Gallary Constructor');
    ar.params.pipe(takeUntilDestroyed()).subscribe(() => {
      this.isFilterModalVisable = false;
    });
    // const productTagsDoc = this.gallaryHelperDocsDataService.getProductTags();
    // this.productTags$ = productTagsDoc.pipe(
    //   map((ptd) => {
    //     if (ptd) {
    //       return Object.keys(ptd.tags).map((key) => ptd.tags[key].tagWord);
    //     } else {
    //       return [];
    //     }
    //   })
    // )
    const batchCustomOptionsDoc =
      this.storeCustomPropertiesService.getProductBatchsOptions();
    this.productBatchsOptionValues$ = batchCustomOptionsDoc;
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
    if (this.productNameWordsInputComponents) {
      this.selectedWord$ = this.productNameWordsInputComponents.changes
        .pipe(
          switchMap((changes: QueryList<TagsInputComponent>) =>
            changes.first
              ? changes.first.tagsInputChange.asObservable()
              : of([])
          )
        )
        .pipe(
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
        this.selectedBatchs$ = this.productBatchsInputComponent.changes
          .pipe(
            switchMap((changes: QueryList<TagsInputComponent | undefined>) =>
              changes.first
                ? changes.first.tagsInputChange.asObservable()
                : of([])
            )
          )
          .pipe(
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
      } else {
        this.scrollEvents = of('initialLoad');
      }

      const queryConstraints$ = this.selectedWord$.pipe(
        combineLatestWith(this.selectedBatchs$),
        distinctUntilChanged(),
        map(([namePrefex, selectedBatchs]) => {
          console.log('val', namePrefex, 'selectedTags: ', selectedBatchs);
          setTimeout(() => {
            this.loaded = false;
          }, 0);

          let q: QueryConstraint[] = [];
          if (namePrefex) {
            q = [...q, where('namePrefexes', 'array-contains', namePrefex)];
          }
          if (selectedBatchs && selectedBatchs.length) {
            q = [
              ...q,
              where('customProperties.' + 'batch', 'in', selectedBatchs),
            ];
          }
          q = [...q, orderBy('lastEditedOn', 'desc')];
          return q;
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
      this.docCount$ = queryConstraints$.pipe(
        switchMap((q) => this.productsService.getDocCount(q))
      );

      this.products$ = queryConstraints$.pipe(
        switchMap((q) => {
          const queriedProducts = this.productsService.getQueryedDocs$(q, 21);
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
          return queriedProducts.pipe(
            tap((products) => {
              this.loaded = true;
              this.ProductsInstance = products;
              if (this.infinitScroll) {
                this.infinitScroll.disabled = false;
              }
            })
          );
        }),
        tap((products) => {
          console.log('products: ', products);
        }),
        shareReplay(1)
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

  onInfinitScroll(ev: Event) {
    const isEvent = ev as unknown as InfiniteScrollCustomEvent;
    isEvent.target.complete();
    const morProducts = this.productsService.getMoreDocs$(21);
    firstValueFrom(morProducts).then((more) => {
      if (more.length) {
        this.ProductsInstance = this.ProductsInstance.concat(more);
      } else {
        isEvent.target.disabled = true;
      }
    });

    // return morProducts;
  }
  canDeactivate() {
    setTimeout(() => {
      this.isFilterModalVisable = false;
    }, 0);
    return of(true);
  }

  // http://127.0.0.1:9199/v0/b/store-gallary.appspot.com/o/stores%5CtHP7s3ysRD4IU45Z0j8N%5CproductPhotos%5Cthumbs%5Cvj6gyRTCersZW44VNh0O_1500x1500.jpeg?alt=media&token=597d48a7-e378-40ec-8d89-9f6f90ccf1b7
  // getthumbUrl(imgId: string) {
  //   const BUCKET_NAME = 'store-gallary.appspot.com';
  //   const OBJECT_NAME = `stores/${this.storeId}/productPhotos/thumbs/${imgId}_150x150.jpeg`;
  //   let url: string;
  //   if (this.environment.useEmulator) {
  //     url = `http://127.0.0.1:9199/${BUCKET_NAME}/${OBJECT_NAME}`;
  //   } else {
  //     url = `https://storage.googleapis.com/${BUCKET_NAME}/${OBJECT_NAME}`;
  //   }
  //   return url;
  // }
  loadHDImage(hImage: HydratedImgDirective, imgId: string, size: number) {
    const BUCKET_NAME = 'store-gallary.appspot.com';
    const OBJECT_NAME = `stores/${this.storeId}/productPhotos/thumbs/${imgId}_${size}x${size}`;
    let url: string;
    if (this.environment.useEmulator) {
      url = `http://127.0.0.1:9199/${BUCKET_NAME}/${OBJECT_NAME}`;
    } else {
      url = `https://storage.googleapis.com/${BUCKET_NAME}/${OBJECT_NAME}`;
    }
    console.log('url: ', url);

    hImage.setNewRenderedImage(url);
  }
  onSlideChange(event: Event) {
    console.log('slideChange event', event);
    const swiper = (event as CustomEvent).detail[0] as Swiper;
    const index = swiper.activeIndex;
    const productId = this.ProductsInstance[index].id;

    const url = this.location.path().split('?')[0];

    this.location.replaceState(url, 'productId=' + productId);
  }
  trackBy(index: number, name: Product): string {
    return name.id;
  }
  logout() {
    signOut(this.fbAuth);
  }
}
