import { Injectable } from '@angular/core';
import { SharedFile } from '@store-app-repository/app-models';

@Injectable({
  providedIn: 'root',
})
export class SharedFilesService {
  constructor() {
    this.sharedMediaP = this.getSharedImage().then((file) => {
      return this.onFilesShared(file);
    });
  }
  // msg = 'load image event not trigered yet';

  // private sharedMedia: SharedFile[];
  sharedMediaP: Promise<SharedFile[]>;
  private async init() {
    // placeHoldereSrc = "../../assets/icon/attachImage.png";
    //  this.imgUrl = "../../assets/icon/attachImage.png";
    // this.sharedMedia = [];
  }

  // private onFileShared(file: File) {
  //   this.file = file;
  //   this.imgUrl = URL.createObjectURL(this.file);
  //  // this.productPickers.changes.pipe(first()).subscribe((productPickers: QueryList<ProductPickerComponent>) => {
  //  //   this.productPicker.selectProduct();
  //  // });
  // }

  // private hasSharedFiles() {
  //   return this.sharedMedia.length > 0;
  // }

  private onFilesShared(mediaFiles: File[]) {
    const sharedMedia: SharedFile[] = [];
    for (const mediaFile of mediaFiles) {
      // Do something with each mediaFile
      const file = mediaFile;
      const imgUrl = URL.createObjectURL(file);

      sharedMedia.push({ file, imgUrl });
    }
    return sharedMedia;

    // this.productPickers.changes.pipe(first()).subscribe((productPickers: QueryList<ProductPickerComponent>) => {
    //   this.productPicker.selectProduct();
    // });
  }

  /** Wait for a shared image */
  private getSharedImage(): Promise<File[]> {
    return new Promise((resolve) => {
      const onmessage = (event: MessageEvent) => {
        console.log('dom receive message : ', event);
        if (event.data.action !== 'load-image') {
          return;
        }
        resolve(event.data.mediaFiles);
        //  this.event = event;
        navigator.serviceWorker.removeEventListener('message', onmessage);
      };

      navigator.serviceWorker.addEventListener('message', onmessage);

      // This message is picked up by the service worker - it's how it knows we're ready to receive
      // the file.
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage('share-ready');
        console.log('dom send message : share ready');
      }
    });
  }
}
