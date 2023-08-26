import { Directive, ElementRef, Input, OnInit, inject } from '@angular/core';
import { storeIdToken } from '../app.routes';
import { environmentToken } from '@store-app-repository/firestor-services';
import { ImageMeta } from '@store-app-repository/app-models';

@Directive({
  selector: '[storeAppRepositoryProductImg]',
  standalone: true,
  exportAs: 'storeAppRepositoryProductImg',
})
export class ProductImgDirective implements OnInit {
  @Input({ required: true, alias: 'storeAppRepositoryProductImg' }) imgId:
    | string
    | undefined;
  @Input() imgMeta?: ImageMeta[];

  @Input() size = 200;
  storeId = inject(storeIdToken);
  environment = inject(environmentToken);

  originalSrc = '';
  isLoading = false;
  isError = false;
  imgElement: HTMLImageElement = this.elementRef.nativeElement;
  loadedSize = 0;
  constructor(private elementRef: ElementRef) {}
  ngOnInit(): void {
    if (!this.imgElement.src) {
      this.loadThumb(this.size);
    } else if (this.size) {
      this.imgElement.onload = (ev) => {
        this.fixIfDestorted(this.size);
      };
    }
  }

  fixIfDestorted(size: number) {
    if (this.imgMeta) {
      const clientWidth = this.imgElement.clientWidth;
      const clientHeight = this.imgElement.clientHeight;

      // const marginClientWidth = clientWidth * 0.95;
      // const marginClientHeight = clientHeight * 0.95;
      const clientAspectRatio = clientWidth / clientHeight;

      const imgAspectRatio = this.imgMeta[0].width / this.imgMeta[0].height;
      const imgWidthForSize = imgAspectRatio * size;
      const imgHeightForSize = (size * 1) / imgAspectRatio;

      const clientMaxUsableHeight =
        imgAspectRatio > clientAspectRatio
          ? clientWidth / imgAspectRatio
          : clientHeight;
      const clientMaxUsableWidth =
        imgAspectRatio < clientAspectRatio
          ? clientHeight * imgAspectRatio
          : clientWidth;

        const clientMaxUsableWidthAndHeight = clientMaxUsableWidth> clientMaxUsableHeight?clientMaxUsableWidth : clientMaxUsableHeight

            if (clientMaxUsableWidth > imgWidthForSize) {
            if (size === 200) {
              const imgWidthFor600 = imgAspectRatio * 600;
              // const imgWidthFor1500 = imgAspectRatio * 1500;
              if (clientMaxUsableWidth <= imgWidthFor600) {
                this.loadThumb(600);
              } else {
                this.loadThumb(1500);
              }
            }

            if (clientMaxUsableHeight > imgHeightForSize) {
              if (size === 200) {
                const imgHeightFor600 = imgAspectRatio * 600;
                // const imgWidthFor1500 = imgAspectRatio * 1500;
                if (clientMaxUsableHeight <= imgHeightFor600) {
                  this.loadThumb(600);
                } else {
                  this.loadThumb(1500);
                }
              }
      }
    }
  }}
  

  loadThumb(size: number) {
    if (this.imgId) {
      this.loadedSize = size;
      const thumbPath = this.getImgPath(this.imgId, size);
      this.imgElement.src = thumbPath;
      this.imgElement.onload = (e) => {
        this.isError = false;
        this.isLoading = false;
        this.fixIfDestorted(size);
      };
      this.imgElement.onerror = (e) => {
        this.imgElement.src = '../../../assets/imgs/noimg.jpg';
        // this.isLoading = true;
        this.isError = true;
        // setTimeout(() => {
        //   console.log("retry Loading Img")
        //   this.load200Thumb();
        // }, 4000);
      };
    }
  }

  // private setFirstRenderedImage() {
  //   if (this.storeAppRepositoryHydratedImg) {
  //     this.setNewRenderedImage(this.storeAppRepositoryHydratedImg);
  //   }
  // }
  // public setNewRenderedImage(imgPath: string) {
  //   const imgElement: HTMLImageElement = this.elementRef.nativeElement;
  //   this.originalSrc = imgElement.src;
  //   if (imgPath) {
  //     this.isLoading = true;
  //     const largeImage = new Image();
  //     largeImage.src = imgPath;
  //     largeImage.onload = () => {
  //       imgElement.src = imgPath;
  //       this.isLoading = false;
  //       this.isError = false;
  //       // this.loadingController.dismiss();
  //     };
  //     largeImage.onerror = (ev) => {
  //       this.isLoading = false;
  //       this.isError = true;
  //       // this.loadingController.dismiss();
  //     };
  //   }
  // }

  getImgPath(imgId: string, size: number) {
    const BUCKET_NAME = 'store-gallary.appspot.com';
    const OBJECT_NAME = `stores/${this.storeId}/productPhotos/thumbs/${imgId}_${size}x${size}`;
    let url: string;
    if (this.environment.useEmulator) {
      url = `http://127.0.0.1:9199/${BUCKET_NAME}/${OBJECT_NAME}`;
    } else {
      url = `https://storage.googleapis.com/${BUCKET_NAME}/${OBJECT_NAME}`;
    }
    console.log('url: ', url);

    return url;
  }
}
