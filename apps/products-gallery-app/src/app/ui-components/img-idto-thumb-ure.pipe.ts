import { Pipe, PipeTransform, inject } from '@angular/core';
import { FirebaseIdString } from '@store-app-repository/app-models';
import { storeIdToken } from '../app.routes';
import { environmentToken } from '@store-app-repository/firestor-services';

@Pipe({
  name: 'imgIdtoThumbUre',
  standalone: true,
  pure: true
})
export class ImgIdtoThumbUrePipe implements PipeTransform {
  storeId = inject(storeIdToken);
  environment = inject(environmentToken)

  transform(imgId: FirebaseIdString, size = 200): string {
      const BUCKET_NAME = 'store-gallary.appspot.com';
      const OBJECT_NAME = `stores/${this.storeId}/productPhotos/thumbs/${imgId}_${size}x${size}`;
      let url: string;
      if (this.environment.useEmulator) {
        url = `http://127.0.0.1:9199/${BUCKET_NAME}/${OBJECT_NAME}`;
      } else {
        url = `https://storage.googleapis.com/${BUCKET_NAME}/${OBJECT_NAME}`;
      }
      return url;
    }
}
