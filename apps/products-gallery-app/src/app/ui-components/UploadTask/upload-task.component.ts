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
import { percentage, fromTask } from '@angular/fire/storage';
import { DomSanitizer } from '@angular/platform-browser';
import { IonModal, IonicModule } from '@ionic/angular';
import {
  FileInfo,
  ImageMeta,
  UploadTaskComponentData,
} from '@store-app-repository/app-models';

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { Storage } from '@angular/fire/storage';
import { Subscription, tap, finalize, catchError, map } from 'rxjs';
import { ImageCropModalComponent } from '../ImageCropModal/image-crop-modal.component';
import { storeIdToken } from '../../app.routes';

@Component({
  selector: 'store-app-repository-upload-task',
  standalone: true,
  imports: [CommonModule, IonicModule, ImageCropModalComponent],
  templateUrl: './upload-task.component.html',
  styleUrls: ['./upload-task.component.scss'],
})
export class UploadTaskComponent implements OnInit, OnDestroy {
  lImgInfo!: FileInfo;
  subscription: Subscription | undefined;
  storagePath: string;

  @Input({ required: true }) set imgInfo(val: FileInfo) {
    this.lImgInfo = val;

    if (!val.uploadTaskData) {
      val.uploadTaskData = {} as UploadTaskComponentData;
      val.uploadTaskData.dataUri = URL.createObjectURL(
        val.croppeDataBlob || val.file
      );
      val.uploadTaskData.safeDataUrl =
        this.sanitizer.bypassSecurityTrustResourceUrl(
          val.uploadTaskData.dataUri
        );

      val.uploadTaskData.downloadUrlChange = new EventEmitter<string>();
      val.uploadTaskData.cancel = new EventEmitter();

      // this.startUpload();
    }
    this.subscription = val.uploadTaskData.cancel.subscribe((r) =>
      this.cancel.emit(r)
    );
    this.subscription.add(
      val.uploadTaskData.downloadUrlChange.subscribe((v) => {
        this.imgInfo.downloadUrl = v;
        this.downloadComplete.emit(this.imgInfo);
      })
    );
  }
  get imgInfo() {
    return this.lImgInfo;
  }

  @ViewChild(IonModal) modal: IonModal | undefined;

  @Input() folderPath: string | undefined;
  @Input() slideMode: boolean | undefined;

  @Output() downloadComplete = new EventEmitter<FileInfo>();
  @Output() thumbsProperiesChanged = new EventEmitter<ImageMeta[]>();
  @Output() cancel = new EventEmitter();
  // task: UploadTask;

  constructor(
    private storage: Storage,
    // private db: Firestore,

    private sanitizer: DomSanitizer // private ImageCropModalService: ImageCropModalService, // private pageService: StoragePathService
  ) {
    const storId = inject(storeIdToken);
    this.storagePath = `/stores/${storId}/productPhotos`;
  }

  ngOnInit() {
    // this.imgInfo.uploadTaskData.startUpload();
  }
  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onUploadCanceled() {
    if (this.imgInfo) {
      if (this.imgInfo.uploadTaskData.task) {
        this.imgInfo.uploadTaskData.task.cancel();
        this.imgInfo.uploadTaskData.cancel.emit();

      } else {
        this.imgInfo.uploadTaskData.cancel.emit();
      }
    }
  }
  showEditPhoto() {
    this.showModal(this.imgInfo).then((cropped) => {
      if (cropped && cropped.croppeDataBlob && this.imgInfo.uploadTaskData) {
        this.imgInfo.uploadTaskData.dataUri = URL.createObjectURL(
          cropped.croppeDataBlob
        );
      }
    });
  }
  imgFileLoded(slideImgFile: HTMLImageElement) {
    if (!this.imgInfo.imageMeta) {
      const width = slideImgFile.naturalWidth;
      const height = slideImgFile.naturalHeight;
      console.log('width: ', width, 'height: ', height);
      this.imgInfo.imageMeta = { width, height, subName: '' };

      const imgmetas: ImageMeta[] = this.getThumbsProperties(this.imgInfo.imageMeta);
      this.thumbsProperiesChanged.emit(imgmetas);
      this.imgInfo.thumbsMeta = imgmetas;
    }
  }
  private getThumbsProperties(imageMeta: ImageMeta) {
    const thumbSizes = [200, 600, 1500];
    const imgmetas: ImageMeta[] = [];
    for (let index = 0; index < thumbSizes.length; index++) {
      const size = thumbSizes[index];
      let width = size, height = size;
      if (imageMeta.width > imageMeta.height) {
        height = size;
        width =
          (size * imageMeta.height) /
          imageMeta.width;
      } else if (imageMeta.width < imageMeta.height) {
        width = size;
        height =
          (size * imageMeta.width) /
          imageMeta.height;
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

    // The main task
    this.imgInfo.uploadTaskData.task = uploadBytesResumable(
      storageRef,
      this.imgInfo.croppeDataBlob || this.imgInfo.file,
      {
        // width: this.imgInfo.
      }
    );

    // Progress monitoring
    this.imgInfo.uploadTaskData.percentage = percentage(
      this.imgInfo.uploadTaskData.task
    ).pipe(tap(console.log));
    let snap: UploadTaskSnapshot;

    this.imgInfo.uploadTaskData.snapshot = fromTask(
      this.imgInfo.uploadTaskData.task
    ).pipe(
      map((snapshot) => {
        snap = snapshot;
        return { snap: snapshot, ref: storageRef };
      }),
      tap(console.log),
      // The file's download URL
      finalize(async () => {
        this.imgInfo.uploadTaskData.downloadURL = await getDownloadURL(
          storageRef
        );
        this.imgInfo.downloadUrl = this.imgInfo.uploadTaskData.downloadURL;
        // await updateDoc(newDocRef, {
        //   downloadURL: this.imgInfo.uploadTaskData.downloadURL,
        // }); // downloadURL: this.imgInfo.uploadTaskData.downloadURL,

        this.imgInfo.uploadTaskData.downloadUrlChange.emit(
          this.imgInfo.uploadTaskData.downloadURL
        );
        URL.revokeObjectURL(this.imgInfo.uploadTaskData.dataUri);
        //  return this.downloadURL;
        return { snap, ref: storageRef };
      }),
      catchError(async (err) => {
        console.log('error upload ', err);
        return { snap, ref: storageRef };
      })
    );
    // }))
    return this.imgInfo.uploadTaskData.snapshot
      .pipe(map((snap) => ({ ref: storageRef, snap })))
      .toPromise();
  }

  isActive(snapshot: UploadTaskSnapshot) {
    return (
      snapshot.state === 'running' &&
      snapshot.bytesTransferred < snapshot.totalBytes
    );
  }

  async showModal(imgInfo: FileInfo): Promise<FileInfo | null> {
    // Lazy load the image crop modal (an Angular Ivy feature)
    if (!this.modal) {
      return null;
    }
    await this.modal.present();

    const result = await this.modal.onWillDismiss();

    if (result.data && result.data.imgInfo) {
      return result.data.imgInfo as FileInfo;
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
