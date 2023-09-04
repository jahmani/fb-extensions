import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  Input,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SwipperHelperDirective } from '../swipper-helper.directive';
import { HydratedImgDirective } from '../hydrated-img.directive';
import { ImgIdtoThumbUrePipe } from '../img-idto-thumb-ure.pipe';
import { Product } from '@store-app-repository/app-models';
import { environmentToken } from '@store-app-repository/firestor-services';
import { storeIdToken } from '../../app.routes';
import { Swiper, SwiperOptions } from 'swiper/types';
import { A11y, Mousewheel, Navigation, Pagination } from 'swiper/modules';
import { RouterLink } from '@angular/router';
import { register } from 'swiper/element';

@Component({
  selector: 'store-app-repository-products-slides-view',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    SwipperHelperDirective,
    HydratedImgDirective,
    ImgIdtoThumbUrePipe,
    RouterLink,
  ],
  templateUrl: './products-slides-view.component.html',
  styleUrls: ['./products-slides-view.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  encapsulation: ViewEncapsulation.None,
})
export class ProductsSlidesViewComponent {
  @Input({ required: true }) products: Product[] = [];
  slideIndex = 0;
  @Input() set intialSlideIndex(value: number) {
    this.config.initialSlide = value;
    this.slideIndex = value;
  }

  public config: SwiperOptions = {
    modules: [Navigation, Pagination, A11y, Mousewheel],
    autoHeight: false,
    // virtual: true,
    // initialSlide: this.intialSlideIndex || 0,
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

  environment = inject(environmentToken);
  storeId = inject(storeIdToken);

  constructor(private location: Location) {
    register();
  }
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
    this.slideIndex = index;
    const productId = this.products[index].id;

    const url = this.location.path().split('?')[0];

    this.location.replaceState(url, 'productId=' + productId);
  }
  trackBy(index: number, name: Product): string {
    return name.id;
  }
}
