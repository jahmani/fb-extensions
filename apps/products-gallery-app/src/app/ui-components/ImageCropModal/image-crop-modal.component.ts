import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  NgModule,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController, IonicModule } from '@ionic/angular';
import { FileInfo } from '@store-app-repository/app-models';
import {
  ImageTransform,
  ImageCropperComponent,
  ImageCroppedEvent,
  base64ToFile,
  ImageCropperModule,
} from 'ngx-image-cropper';

@Component({
  selector: 'store-app-repository-image-crop-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, ImageCropperModule],
  templateUrl: './image-crop-modal.component.html',
  styleUrls: ['./image-crop-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageCropModalComponent implements OnInit {
  transform: ImageTransform = {};
  canvasRotation = 0;

  private croppedImageBase64 = '';
  #imgInfo: FileInfo | null = null;
  /**
   * Image to be cropped as a base64 string.
   * Should be passed in from the component calling this modal.
   */
  @Input({ required: true }) set imgInfo(val: FileInfo | null) {
    this.#imgInfo = val;
    if (this.imgInfo && !this.imgInfo.data) {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(this.imgInfo.file);
      fileReader.onloadend = () => {
        if (this.imgInfo) {
          this.imgInfo.data = fileReader.result as string;
        }
        this.cd.detectChanges();
      };
    }
  }
  get imgInfo() {
    return this.#imgInfo;
  }

  @ViewChild(ImageCropperComponent) imageCropper:
    | ImageCropperComponent
    | undefined;

  imageBase64 = '';

  constructor(
    private modalController: ModalController,
    private cd: ChangeDetectorRef
  ) {}

  rotateLeft() {
    this.canvasRotation--;
    this.flipAfterRotate();
  }

  rotateRight() {
    this.canvasRotation++;
    this.flipAfterRotate();
  }

  private flipAfterRotate() {
    const flippedH = this.transform.flipH;
    const flippedV = this.transform.flipV;
    this.transform = {
      ...this.transform,
      flipH: flippedV,
      flipV: flippedH,
    };
  }
  ngOnInit() {
    //
  }

  imageCropped(event: ImageCroppedEvent) {
    console.log('this.imageCropper.format', this.imageCropper?.format);

    if (event.base64) {
      this.croppedImageBase64 = event.base64;
    }
    console.log('cropp event', event);
  }

  dismissModal(croppedImageBase64?: string) {
    const blob = base64ToFile(this.croppedImageBase64);
    // const croppedUrl = URL.createObjectURL(File);
    if (this.imgInfo) {
      this.imgInfo.croppeDataBlob = blob;
    }
    this.modalController.dismiss({ imgInfo: this.imgInfo });
  }
  cancel() {
    return this.modalController.dismiss(undefined);
  }
}
