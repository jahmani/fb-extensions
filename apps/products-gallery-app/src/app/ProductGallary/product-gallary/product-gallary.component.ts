import {
  AfterViewInit,
  OnInit,
  ChangeDetectorRef,
  Component,
  Input,
  // QueryList,
  ViewChild,
  // ViewChildren,
  inject,
} from '@angular/core';
import {
  CommonModule,
  NgOptimizedImage,
  Location,
  NgComponentOutlet,
} from '@angular/common';
import { Auth, signOut } from '@angular/fire/auth';
import { AndCompositeQuery, Product } from '@store-app-repository/app-models';
import {
  Observable,
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
  IonPopover,
  IonicModule,
} from '@ionic/angular';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { ProductsDataService } from '../../dataServices/products-data.service';
import { TagsInputComponent } from '../../ui-components/TagsInput/tags-input.component';
// import { WordSuggestionsDataService } from '../../dataServices/word-suggestions-data.service';
import {
  FirebaseloggerService,
  environmentToken,
} from '@store-app-repository/firestor-services';
import { where } from '@angular/fire/firestore';
// import { GallaryHelperDocsDataService } from '../../dataServices/gallary-helper-docs-data.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { storeIdToken } from '../../app.routes';
import { ImgIdtoThumbUrePipe } from '../../ui-components/img-idto-thumb-ure.pipe';
// import { StoreCustomPropertiesService } from '../../dataServices/store-custom-properties.service';
import { QueryOrderByConstraint, orderBy } from 'firebase/firestore';
import { HydratedImgDirective } from '../../ui-components/hydrated-img.directive';
import { FirebaseUserService } from '../../authServices/firebase-user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ProductImgDirective } from '../../ui-components/product-img.directive';
import { RetryImgLoadDirective } from '../../ui-components/retry-img-load.directive';
import { ProductsSlidesViewComponent } from '../../ui-components/ProductsSlidesView/products-slides-view.component';
import { QueryFieldFilterConstraint } from 'firebase/firestore/lite';
import { ProductsQueryDataService } from '../../dataServices/products-query-data.service';
import { ProductFilterComponent } from '../../ui-components/ProductFilter/product-filter.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

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
    NgComponentOutlet,
    ProductFilterComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './product-gallary.component.html',
  styleUrls: ['./product-gallary.component.scss'],
})
export class ProductGallaryComponent implements AfterViewInit, OnInit {
  private _hideBatch: boolean | undefined;
  public get hideBatch() {
    if (this._hideBatch === undefined) {
      const lsvalue = localStorage.getItem('hideBatch');
      if (lsvalue) {
        this._hideBatch = JSON.parse(lsvalue);
      } else {
        this._hideBatch = false;
      }
    }
    return this._hideBatch;
  }
  public set hideBatch(value) {
    this._hideBatch = value;
    localStorage.setItem('hideBatch', JSON.stringify(value));
  }
  slideView = true;
  intialSlideIndex = 0;
  ProductsInstance: Product[] = [];
  slidsInput = { intialSlideIndex: 0, products: this.ProductsInstance };
  dynamicSlidesComponent: typeof ProductsSlidesViewComponent | null = null;
  filterText$: Observable<string> | undefined;
  firstAndQuery: Observable<AndCompositeQuery | null> | undefined;
  @Input() set productId(value: string) {
    if (value) {
      this.setSlidesView(value);
    } else {
      this.slideView = false;
    }
  }
  @Input() set queryId(value: string) {
    if (value) {
      firstValueFrom(this.qs.doc$(value)).then((q) => {
        if (q) {
          const query = q.query[0];
          console.log('paased query: ', query);
        }
      });
    } else {
      this.slideView = false;
    }
  }
  async setSlidesView(value: string) {
    this.slideView = true;

    if (!this.dynamicSlidesComponent) {
      const { ProductsSlidesViewComponent } = await import(
        '../../ui-components/ProductsSlidesView/products-slides-view.component'
      );
      this.dynamicSlidesComponent = ProductsSlidesViewComponent;
    }

    if (this.ProductsInstance) {
      this.intialSlideIndex = this.ProductsInstance.findIndex(
        (product) => product.id === value
      );
      this.slidsInput.intialSlideIndex = this.intialSlideIndex;
      // this.config.initialSlide = this.intialSlideIndex || 0;
    }
  }

  filterFormControl = new FormControl<AndCompositeQuery>([]);

  heightInGridRows = 3;
  isProductActionsOpen = false;
  @ViewChild('popover') popover: IonPopover | undefined;
  showProductInfo = true;
  isOpen = false;
  @ViewChild(IonInfiniteScroll) infinitScroll: IonInfiniteScroll | undefined;
  storeId = inject(storeIdToken);
  private productsService = inject(ProductsDataService);
  private cdr = inject(ChangeDetectorRef);

  products$: Observable<Product[]> | undefined;

  previewProduct: Product | null = null;
  environment = inject(environmentToken);
  fbAuth = inject(Auth);
  user = inject(FirebaseUserService).user;
  loaded = false;
  scrollEvents: Observable<CustomEvent<void> | 'initialLoad'> | undefined;
  docCount$: Observable<number> | undefined;
  networkStatus$ = inject(FirebaseloggerService).realNetworkStatus;
  isFilterModalVisable = false;

  constructor(
    private ar: ActivatedRoute,
    private location: Location,
    private qs: ProductsQueryDataService
  ) {
    console.log('products Gallary Constructor');
    ar.params.pipe(takeUntilDestroyed()).subscribe(() => {
      this.isFilterModalVisable = false;
    });
  }
  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.infinitScroll) {
      this.scrollEvents = this.infinitScroll.ionInfinite;
    } else {
      this.scrollEvents = of('initialLoad');
    }
    this.firstAndQuery = this.filterFormControl.valueChanges.pipe(
      startWith(this.filterFormControl.value),
      shareReplay(1)
    );
    const fsQuery = this.firstAndQuery.pipe(
      map((aq) => {
        if (aq && aq.length) {
          const cq = aq;
          const res: (QueryFieldFilterConstraint | QueryOrderByConstraint)[] =
            cq.map((q) => {
              if (q.type === 'where') {
                return where(q.fieldPath, q.opStr, q.value);
              } else {
                return orderBy(q.fieldPath, q.directionStr);
              }
            });
          return res;
        }
        return [];
      })
    );
    const queryConstraints$ = fsQuery.pipe(
      map((qc) => {
        if (qc.find((c) => c.type === 'orderBy')) {
          return [...qc, orderBy('lastEditedOn', 'desc')];
        } else {
          return [...qc, orderBy('lastEditedOn', 'desc')];
        }
      })
    );
    this.filterText$ = this.firstAndQuery.pipe(
      map((q) => {
        const res =
          q?.reduce(
            (prev, cur) =>
              cur.type === 'where'
                ? prev +
                  ' ' +
                  (cur.fieldPath === 'customProperties.batch'
                    ? cur.value.join()
                    : cur.value)
                : prev,
            ' '
          ) || '';
        return res;
      })
    );
    this.docCount$ = queryConstraints$.pipe(
      switchMap((q) => this.productsService.getDocCount(q))
    );

    this.products$ = queryConstraints$.pipe(
      switchMap((q) => {
        const queriedProducts = this.productsService.getQueryedDocs$(q, 21);
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

  trackBy(index: number, name: Product): string {
    return name.id;
  }
  logout() {
    signOut(this.fbAuth);
  }

  showProductPreview(
    imgContainer: HTMLElement,
    gridContainer: HTMLElement,
    scrollContainer: CdkVirtualScrollViewport
  ) {
    this.isFilterModalVisable = false;
    setTimeout(() => imgContainer.scrollIntoView(true), 1);
    this.cdr.detectChanges();

    // Get the scroll position of the grid container
    const scrollElement = scrollContainer.elementRef.nativeElement;

    // Get the height of the grid container in pixels
    const containerHeight = scrollElement.clientHeight;

    // Get the height of a single grid row in pixels
    const rowHeight = parseFloat(
      window.getComputedStyle(gridContainer).getPropertyValue('grid-auto-rows')
    );

    // Calculate the height in terms of grid rows
    const heightInGridRows = Math.floor(containerHeight / rowHeight);
    this.heightInGridRows = heightInGridRows;
    console.log('Height in grid rows:', heightInGridRows);
  }

  presentPopover(e: Event) {
    e.stopPropagation();
    if (this.popover) {
      this.popover.event = e;
    }
    this.isProductActionsOpen = true;
  }
  copyText(product: Product) {
    let text = '*' + product.name + '*';
    if (product.price) {
      text += '\nالسعر:' + product.price;
    }
    if (product.sizes) {
      text += '\nالقياس:' + product.sizes;
    }
    if (product.modelNos?.length) {
      text += '\nموديل:' + product.modelNos.join('|');
    }

    navigator.clipboard.writeText(text);
  }
}
