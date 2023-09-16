import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[storeAppRepositoryHydratedImg]',
  standalone: true,
  exportAs: 'storeAppRepositoryHydratedImg',
})
export class HydratedImgDirective implements OnInit {
  @Input({ required: true }) storeAppRepositoryHydratedImg: string | undefined;
  originalSrc = '';
  isLoading = false;
  isError = false;
  imgElement: HTMLImageElement = this.elementRef.nativeElement;
  constructor(private elementRef: ElementRef) {}
  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.setFirstRenderedImage();
    this.imgElement.onerror = (
      event: Event | string,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ) => {
      console.log('img load error', error);
      console.log('img load event', event);
    };
  }

  private setFirstRenderedImage() {
    if (this.storeAppRepositoryHydratedImg) {
      this.setNewRenderedImage(this.storeAppRepositoryHydratedImg);
    }
  }
  public setNewRenderedImage(imgPath: string) {
    const imgElement: HTMLImageElement = this.elementRef.nativeElement;
    this.originalSrc = imgElement.src;
    if (imgPath) {
      this.isLoading = true;
      const largeImage = new Image();
      largeImage.src = imgPath;
      largeImage.onload = () => {
        imgElement.src = imgPath;
        setTimeout(() => {
          this.isLoading = false;
          this.isError = false;
        }, 100);

        // this.loadingController.dismiss();
      };
      largeImage.onerror = (ev) => {
        this.isLoading = false;
        this.isError = true;
        // this.loadingController.dismiss();
      };
    }
  }
}
