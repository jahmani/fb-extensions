import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  forwardRef,
  inject,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import {
  IonModal,
  IonRouterOutlet,
  IonicModule,
  ItemReorderEventDetail,
} from '@ionic/angular';
import {
  FileInfo,
  ImageMeta,
  ProductThumpsProperties,
  SortableProductThumpsProperties,
  getExtendedFileData,
} from '@store-app-repository/app-models';

import { UploadTaskComponent } from '../UploadTask/upload-task.component';
import { SharedFilesService } from '../../services/shared-files.service';
import { CommonModule } from '@angular/common';
import { FileIdGetterToken } from '../../ProductGallary/edit-product/edit-product.page';
import { ImgIdtoThumbUrePipe } from '../img-idto-thumb-ure.pipe';
import { ThumbObjToImgIdsPipe } from '../thumb-obj-to-img-ids.pipe';

const defaultFileIdGetter = (fileInfo: FileInfo) => {
  const id = `/${Date.now()}_${fileInfo.name}`;
  return id;
};

@Component({
  selector: 'store-app-repository-form-photo-control',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    UploadTaskComponent,
    ImgIdtoThumbUrePipe,
    ThumbObjToImgIdsPipe,
  ],
  templateUrl: './form-photo-control.component.html',
  styleUrls: ['./form-photo-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormPhotoControlComponent),
      multi: true,
    },
  ],
})
export class FormPhotoControlComponent
  implements OnInit, ControlValueAccessor, AfterViewInit
{
  @Input() folderPath: string | undefined;
  @ViewChild('modal') modal: IonModal | undefined;
  // @ViewChild('reorderModal') reorderModal: IonModal | undefined;

  private _value: SortableProductThumpsProperties[] = [];
  showReorder = true;
  @ViewChild('fileInput') fileInput: ElementRef | undefined;
  @ViewChildren(UploadTaskComponent) allUploadTasksComponents:
    | QueryList<UploadTaskComponent>
    | undefined;

  showBussyAlert = false;
  sharedFilesInfo: FileInfo[] = [];
  inputFiles: FileInfo[] = [];
  uplodedImgFiles: FileInfo[] = [];
  modalFilesOrImgIds: FileInfo[] | SortableProductThumpsProperties[] = [];
  fileIdGetter: ((fileInfo: FileInfo) => Promise<string>) | null;

  set value(value: SortableProductThumpsProperties[]) {
    this._value = value;
    this.notifyValueChange();
  }

  get value(): SortableProductThumpsProperties[] {
    return this._value;
  }

  onChange: ((value: unknown) => unknown) | undefined;
  onTouched: (() => unknown) | undefined;
  presentingElement = this.ionRouterOutlet.nativeEl;

  constructor(
    private sharedFilesService: SharedFilesService,
    private readonly ionRouterOutlet: IonRouterOutlet
  ) {
    this.fileIdGetter = inject(FileIdGetterToken, { optional: true });
  }
  ngAfterViewInit(): void {
    this.sharedFilesService.sharedMediaP.then((sf) => {
      this.sharedFilesInfo = this.extendAllSharedFiles(sf);
    });
  }

  notifyValueChange(): void {
    if (this.onChange) {
      this.onChange(this.value);
    }
  }

  ngOnInit(): void {}

  writeValue(obj: SortableProductThumpsProperties[]): void {
    this._value = obj;
  }

  registerOnChange(fn: any): void {
    console.log('registerOnChange');
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    console.log('isDisabled : ', isDisabled);
  }

  // onThumbsPropertiesChanged(imgInfo: FileInfo, thumbsMeta: ImageMeta[]) {
  //   const temp: ProductThumpsProperties = {};
  //   temp[imgInfo.docId] = thumbsMeta;
  // }

  onDownloadUrlChangeFromThumb(
    resFile: FileInfo,
    file: FileInfo,
    files: FileInfo[]
  ) {
    if (!this.modal?.isOpen) {
      this.onFileUploadCompleted(resFile, file, files);
    }
  }
  onFileUploadCompleted(resFile: FileInfo, file: FileInfo, files: FileInfo[]) {
    const i = files.indexOf(file);
    if (i === -1) {
      console.log('onFileUploadCompleted called Twice on same file');
    }
    if (i != -1) {
      files.splice(i, 1);
      const id = resFile.docId;
      this.value = this.value || [];
      const s: SortableProductThumpsProperties = {
        imageId: id,
        index: this.value.length,
        metas: resFile.thumbsMeta,
      };
      this.value = [...this.value, s];
    }
    if (files.length === 0 && this.isHaveOpenModal()) {
      this.closeOpenModal();
    }
  }

  onUploadCancelFromThumb(file: FileInfo, files: FileInfo[]) {
    if (!this.modal?.isOpen) return this.onUploadCancel(file, files);
  }

  onUploadCancel(file: FileInfo, files: FileInfo[]) {
    const i = files.indexOf(file);
    console.log('index of removed file: ', i);
    if (i !== -1) {
      files.splice(i, 1);
    }
  }

  onIamgeRemoved(imgID: string) {
    const index = this.value.findIndex((m) => m.imageId === imgID);
    this.value.splice(index, 1);
    this.notifyValueChange();
  }

  extendAllSharedFiles(sharedFiles: { file: File; imgUrl: string }[]) {
    return sharedFiles.map((file) => {
      const sharedFileInfo = getExtendedFileData(file.file);
      return sharedFileInfo;
    });
  }

  async onFileSelected($event: Event) {
    $event.stopPropagation();
    const target = $event.target as HTMLInputElement;
    console.log(target?.files);

    const files = Array.from((<HTMLInputElement>$event.target).files || []);
    const extendedFiles = files.map((f) => getExtendedFileData(f));

    this.inputFiles = [...extendedFiles, ...this.inputFiles];
    if (this.inputFiles.length > 0) {
      this.openPhotoModal(this.inputFiles);
    }
    if (this.fileIdGetter) {
      for (let index = 0; index < extendedFiles.length; index++) {
        const file = extendedFiles[index];
        file.docId = await this.fileIdGetter(file);
      }
    } else {
      for (let index = 0; index < extendedFiles.length; index++) {
        const file = extendedFiles[index];
        file.docId = defaultFileIdGetter(file);
      }
    }
    target.value = '';
  }
  openNativeFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  isBussy(): boolean {
    return !!this.inputFiles?.length;
  }

  alertBussy() {
    this.showBussyAlert = true;
  }

  openPhotoModal(formimages: FileInfo[] | SortableProductThumpsProperties[]) {
    this.modalFilesOrImgIds = formimages;
    if (this.modal) {
      this.modal.isOpen = true;
    }
  }

  isHaveOpenModal() {
    return this.modal?.isOpen;
  }

  closeOpenModal() {
    if (this.modal) {
      this.modal.isOpen = false;
    }
  }

  isHaveOpenUploadTaskModal() {
    if (this.allUploadTasksComponents) {
      const array = this.allUploadTasksComponents.toArray();
      for (let index = 0; index < array.length; index++) {
        const uploadTaskComponent = array[index];
        if (uploadTaskComponent.haveOpenModal()) {
          return true;
        }
      }
    }
    return false;
  }

  closeOpenUploadTaskModal() {
    if (this.allUploadTasksComponents) {
      const array = this.allUploadTasksComponents.toArray();
      for (let index = 0; index < array.length; index++) {
        const uploadTaskComponent = array[index];
        if (uploadTaskComponent.haveOpenModal()) {
          uploadTaskComponent.closeOpenModal();
          return;
        }
      }
    }
  }

  handleReorder(ev: CustomEvent<ItemReorderEventDetail>) {
    ev.detail.complete(this.value);

    this.notifyValueChange();
  }

  trackByFileId(index: number, file: FileInfo) {
    return file.docId;
  }

  canDeactivate() {
    if (this.isHaveOpenUploadTaskModal()) {
      this.closeOpenUploadTaskModal();
      return false;
    } else if (this.isHaveOpenModal()) {
      this.closeOpenModal();
      return false;
    }
    return true;
  }
}
