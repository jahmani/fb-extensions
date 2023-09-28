import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ImgIdtoThumbUrePipe } from '../ui-components/img-idto-thumb-ure.pipe';
import { HydratedImgDirective } from '../ui-components/hydrated-img.directive';
import { ProductPhoto } from '@store-app-repository/app-models';
import { StorePhotosDataService } from '../dataServices/store-photos-data.service';

@Component({
  selector: 'store-app-repository-store-photos',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ImgIdtoThumbUrePipe,
    HydratedImgDirective,
  ],
  templateUrl: './store-photos.component.html',
  styleUrls: ['./store-photos.component.scss'],
})
export class StorePhotosComponent {
  private storePhotosService = inject(StorePhotosDataService);
  photosDocs$ = this.storePhotosService.getAllDocs$();
  previewProduct: ProductPhoto | undefined = undefined;

  // updateAll(photosDocs: ProductPhoto[]) {
  //   photosDocs.forEach((p) => {
  //     this.updatePhotoCacheControl(p.id);
  //   });
  // }
  // async updatePhotoCacheControl(id: string) {
  //   try {
  //     const res = await this.storePhotosService.updatePhotCacheControl(id);
  //     console.log(res);
  //   } catch (error) {
  //     console.log('err: ', error);
  //   }
  // }
}
