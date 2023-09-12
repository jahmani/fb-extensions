import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  percentage,
  fromTask,
  uploadBytesResumable,
  ref,
} from '@angular/fire/storage';
// import { DomSanitizer } from '@angular/platform-browser';
import { IonModal, IonicModule } from '@ionic/angular';
import {
  FileInfo,
  ImageMeta,
  UploadTaskComponentData,
} from '@store-app-repository/app-models';

import { Storage } from '@angular/fire/storage';
import { Subscription, tap, map } from 'rxjs';
import { ImageCropModalComponent } from '../ImageCropModal/image-crop-modal.component';
import { storeIdToken } from '../../app.routes';
import { ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'store-app-repository-upload-task',
  standalone: true,
  imports: [CommonModule, IonicModule, ImageCropModalComponent],
  templateUrl: './upload-task.component.html',
  styleUrls: ['./upload-task.component.scss'],
})
export class UploadTaskComponent implements OnInit, OnDestroy {
  lImgInfo!: FileInfo;
  storagePath: string;

  public get dataUri(): string {
    return this.imgInfo.cropInfo?.objectUrl || this.imgInfo.fileUrl;
  }

  @Input({ required: true }) set imgInfo(val: FileInfo) {
    this.lImgInfo = val;

    if (!val.uploadTaskData) {
      val.uploadTaskData = {} as UploadTaskComponentData;
      val.uploadTaskData.uploadSucceeded = new EventEmitter();
    }
    val.uploadTaskData.uploadSucceeded.subscribe((v) => {
      this.uploadComplete.emit(val);
    });
  }
  get imgInfo() {
    return this.lImgInfo;
  }

  @ViewChild(IonModal) modal: IonModal | undefined;

  @Input() folderPath: string | undefined;
  @Input() slideMode: boolean | undefined;

  @Output() uploadComplete = new EventEmitter<FileInfo>();
  @Output() cancel = new EventEmitter<FileInfo>();

  constructor(private storage: Storage) {
    const storId = inject(storeIdToken);
    this.storagePath = `/stores/${storId}/productPhotos`;
  }

  ngOnInit() {}
  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
  }

  onUploadCanceled(event: Event) {
    event.stopPropagation();
    let cancelHasEffect = true;
    if (this.imgInfo) {
      if (this.imgInfo.uploadTaskData.task) {
        cancelHasEffect = this.imgInfo.uploadTaskData.task.cancel();
      }
      if (cancelHasEffect || this.imgInfo.uploadTaskData.uploadError) {
        this.cancel.emit(this.imgInfo);
      }
    }
  }

  onUploadResume(event: Event) {
    event.stopPropagation();
    let resumeHasEffect = true;
    if (this.imgInfo) {
      if (this.imgInfo.uploadTaskData.task) {
        resumeHasEffect = this.imgInfo.uploadTaskData.task.resume();
      }
    }
  }

  onUploadPause(event: Event) {
    event.stopPropagation();
    let pauseHasEffect = true;
    if (this.imgInfo) {
      if (this.imgInfo.uploadTaskData.task) {
        pauseHasEffect = this.imgInfo.uploadTaskData.task.pause();
      }
    }
  }
  showEditPhoto() {
    this.showModal().then((cropped) => {
      this.imgInfo.cropInfo = cropped;
    });
  }

  imgFileLoded(slideImgFile: HTMLImageElement) {
    if (!this.imgInfo.imageMeta) {
      const width = slideImgFile.naturalWidth;
      const height = slideImgFile.naturalHeight;
      console.log('width: ', width, 'height: ', height);
      this.imgInfo.imageMeta = {
        size: this.imgInfo.size,
        width,
        height,
        subName: '',
      };

      const imgmetas: ImageMeta[] = this.getThumbsProperties(
        this.imgInfo.imageMeta
      );
      this.imgInfo.thumbsMeta = imgmetas;
    }
  }
  private getThumbsProperties(imageMeta: ImageMeta) {
    const thumbSizes = [200, 600, 1500];
    const imgmetas: ImageMeta[] = [];
    for (let index = 0; index < thumbSizes.length; index++) {
      const size = thumbSizes[index];
      let width = size,
        height = size;
      if (imageMeta.width > imageMeta.height) {
        height = size;
        width = (size * imageMeta.height) / imageMeta.width;
      } else if (imageMeta.width < imageMeta.height) {
        width = size;
        height = (size * imageMeta.width) / imageMeta.height;
      }
      imgmetas.push({ width, height, subName: `_${size}x${size}` });
    }
    return imgmetas;
  }

  async startUpload() {
    const path = this.storagePath + `/${this.imgInfo.docId}`;

    console.log('upload task started to path: ', path);

    // Reference to storage bucket
    const storageRef = ref(this.storage, path);
    let meta = {};
    if (this.imgInfo.cropInfo) {
      const { width, height, ...rest } = this.imgInfo.cropInfo;
      const size = this.imgInfo.cropInfo.blob?.size;
      meta = {
        size: size?.toString(),
        width: width.toString(),
        height: height.toString(),
      };
    } else {
      const { width, height, size, ...rest } = this.imgInfo.imageMeta;
      meta = {
        size: size?.toString(),
        width: width.toString(),
        height: height.toString(),
      };
    } // The main task
    const uploadTask = uploadBytesResumable(
      storageRef,
      this.imgInfo.cropInfo?.blob || this.imgInfo.file,
      { ...meta, cacheControl: 'private,max-age=2592000' }
    );
    uploadTask.then(
      async (snapshot) => {
        //  const downloadUrl = await getDownloadURL(storageRef);
        // this.imgInfo.uploadTaskData.downloadURL = downloadUrl;
        // this.imgInfo.downloadUrl = downloadUrl;
        this.imgInfo.uploadTaskData.uploadSucceeded.emit();
        // this.imgInfo.uploadTaskData.uploadSucceeded.emit();
      },
      (error) => {
        console.log('error upload ', error);
        switch (error.code) {
          case 'storage/canceled':
            break;

          default:
            this.imgInfo.uploadTaskData.uploadError = error;
            break;
        }
      }
    );
    this.imgInfo.uploadTaskData.task = uploadTask;

    // Progress monitoring
    this.imgInfo.uploadTaskData.percentage = percentage(uploadTask).pipe(
      map((p) => p.progress.toFixed(0)),
      tap(console.log)
    );

    this.imgInfo.uploadTaskData.snapshot = fromTask(uploadTask);
  }

  async showModal(): Promise<ImageCroppedEvent | null> {
    // Lazy load the image crop modal (an Angular Ivy feature)
    if (!this.modal) {
      return null;
    }
    await this.modal.present();

    const result = await this.modal.onWillDismiss();

    if (result.data && result.data.cropInfo) {
      return result.data.cropInfo as ImageCroppedEvent;
    } else {
      return null;
    }
  }

  haveOpenModal() {
    return this.modal?.isCmpOpen;
  }
  closeOpenModal() {
    return this.modal?.dismiss();
  }
}
