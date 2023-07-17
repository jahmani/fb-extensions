import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[storeAppRepositoryHydratedImg]',
  standalone: true,
})
export class HydratedImgDirective implements OnInit {
  @Input({ required: true }) storeAppRepositoryHydratedImg: string | undefined;
  originalSrc = '';
  constructor(private elementRef: ElementRef) {}
  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.setFirstRenderedImage();
  }

  private setFirstRenderedImage() {
    const imgElement: HTMLImageElement = this.elementRef.nativeElement;
    this.originalSrc = imgElement.src;
if (this.storeAppRepositoryHydratedImg) {
      imgElement.src = this.storeAppRepositoryHydratedImg;
      const largeImage = new Image();
      largeImage.src = this.originalSrc;
      largeImage.onload = () => {
        imgElement.src = largeImage.src;
        // this.loadingController.dismiss();
      };
}
  }
}
