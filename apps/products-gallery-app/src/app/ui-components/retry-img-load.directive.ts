import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'img[storeAppRepositoryRetryImgLoad]',
  standalone: true,
})
export class RetryImgLoadDirective {
  private _retrySrc = '../../../assets/imgs/shirt.svg';
  maxRetries = 4;
  private retryCount = 0;

  private _timer: NodeJS.Timeout | undefined;
  src: string;
  constructor(private element: ElementRef<HTMLImageElement>) {
    this.src = this.element.nativeElement.src;
  }

  @Input()
  set retrySrc(value: string) {
    this.clearTimer();
    this._retrySrc = value;
    this.element.nativeElement.src = value;
  }

  @HostListener('error')
  loadError() {
    if (this._timer) {
      clearTimeout(this._timer);
      delete this._timer;
    }
    if (this.retryCount < this.maxRetries) {
      const time = (Math.round(Math.random() * 10000) % 3000) + 1000;
      console.log('RetryImgLoadDirective time: ', time);
      ++this.retryCount;
      this.element.nativeElement.src = this._retrySrc;
      this._timer = setTimeout(
        () => (this.element.nativeElement.src = this.src),
        time
      );
    }
  }

  @HostListener('load')
  clearTimer() {
    if (this._timer) {
      console.log('load after error');
      clearTimeout(this._timer);
      delete this._timer;
    }
  }
}
