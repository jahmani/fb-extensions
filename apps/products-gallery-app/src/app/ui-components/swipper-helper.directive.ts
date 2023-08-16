import { AfterViewInit, Directive, ElementRef, Input, NgZone } from '@angular/core';
import { SwiperContainer } from 'swiper/element'
import { SwiperOptions } from 'swiper/types';

@Directive({
  selector: '[storeAppRepositorySwipperHelper]',
  standalone: true,
})
export class SwipperHelperDirective implements AfterViewInit {

  private readonly swiperElement: HTMLElement;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('config')
  config?: SwiperOptions;

  constructor(private el: ElementRef<HTMLElement>) {
    this.swiperElement = el.nativeElement;
  }

  ngAfterViewInit() {
    Object.assign(this.el.nativeElement, this.config);
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.el.nativeElement.initialize();
  }
}
