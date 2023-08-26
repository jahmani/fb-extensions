import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { ModalController, IonicModule } from '@ionic/angular';
import { FileInfo } from '@store-app-repository/app-models';
import {
  ImageTransform,
  ImageCroppedEvent,
  ImageCropperModule,
} from 'ngx-image-cropper';

@Component({
  selector: 'store-app-repository-image-crop-modal',
  standalone: true,
  imports: [IonicModule, ImageCropperModule, NgIf],
  templateUrl: './image-crop-modal.component.html',
  styleUrls: ['./image-crop-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageCropModalComponent implements OnInit {
  transform: ImageTransform = {};
  canvasRotation = 0;


  cropInfo?: ImageCroppedEvent;

  @Input({ required: true }) imgInfo? : FileInfo
  constructor(private modalController: ModalController) {}

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
    this.cropInfo = event;

    console.log('cropp event', event);
  }

  dismissModal() {
    this.modalController.dismiss({ cropInfo: this.cropInfo });
  }
  cancel() {
    return this.modalController.dismiss(undefined);
  }
}
