import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';
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
    

    setTimeout(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
      this.el.nativeElement.initialize();
    }, 0);
  }
}
