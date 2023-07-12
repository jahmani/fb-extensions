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
  getExtendedFileData,
  handleFileInputEvent,
} from '@store-app-repository/app-models';

import { UploadTaskComponent } from '../UploadTask/upload-task.component';
import { SharedFilesService } from '../../services/shared-files.service';
import { CommonModule } from '@angular/common';
import { FileIdGetterToken } from '../../Products/edit-product/edit-product.page';
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
  // folderPath1 ;

  @Input() folderPath: string | undefined;
  @ViewChild('modal') modal: IonModal | undefined;
  @ViewChild('reorderModal') reorderModal: IonModal | undefined;

  // newUrls: string[] = [];
  // removedUrls: string[] = [];
  // formimages: string[] = [];
  private _value: ProductThumpsProperties = {};

  @ViewChild('fileInput') fileInput: ElementRef | undefined;
  @ViewChildren(UploadTaskComponent) allUploadTasksComponents:
    | QueryList<UploadTaskComponent>
    | undefined;

  //  sharedImgUrl: string;
  // sharedFiles: { file: File; imgUrl: string }[]=[];
  showBussyAlert = false;
  sharedFilesInfo: FileInfo[] = [];
  inputFiles: FileInfo[] = [];
  uplodedImgFiles: FileInfo[] = [];
  modalFilesOrImgIds: FileInfo[] | string[] = [];
  fileIdGetter: ((fileInfo: FileInfo) => Promise<string>) | null;
  #oldThumbsProperties: ProductThumpsProperties = {};
  #newThumbsProperties: ProductThumpsProperties = {};
  ImgIdsOrdered: string[] = [];
  get oldThumbsProperties(): Readonly<ProductThumpsProperties> {
    return this.#oldThumbsProperties;
  }
  set oldThumbsProperties(val: ProductThumpsProperties) {
    this.#oldThumbsProperties = val;
    this.oldImgIds = Object.keys(val);
  }
  get newThumbsProperties(): Readonly<ProductThumpsProperties> {
    return this.#newThumbsProperties;
  }
  set newThumbsProperties(val: ProductThumpsProperties) {
    this.#newThumbsProperties = val;
    this.newImgIds = Object.keys(val);
  }
  oldImgIds: string[] = [];
  newImgIds: string[] = [];

  set value(value: ProductThumpsProperties) {
    if (this.ImgIdsOrdered && this.ImgIdsOrdered.length) {
      this.reorderValueObject(value);
    } else {
      this._value = value;
      this.ImgIdsOrdered = Object.keys(this.value);
    }
    this.notifyValueChange();
  }

  get value(): ProductThumpsProperties {
    return this._value;
  }

  private reorderValueObject(value: ProductThumpsProperties) {
    const orderedValue: ProductThumpsProperties = {};
    const valueKeys = Object.keys(value);
    const newValueKeys = valueKeys.filter(
      (key) => !this.ImgIdsOrdered.includes(key)
    );
    for (let index = 0; index < this.ImgIdsOrdered.length; index++) {
      const orderdKey = this.ImgIdsOrdered[index];
      if (value[orderdKey]) {
        orderedValue[orderdKey] = value[orderdKey];
      }
    }
    for (let index = 0; index < this.ImgIdsOrdered.length; index++) {
      const orderdKey = this.ImgIdsOrdered[index];
      if (!value[orderdKey]) {
        this.ImgIdsOrdered.splice(index, 1);
      }
    }

    for (let index = 0; index < newValueKeys.length; index++) {
      const element = newValueKeys[index];
      orderedValue[element] = value[element];
      this.ImgIdsOrdered.push(element);
    }
    this._value = orderedValue;
  }

  onChange: ((value: unknown) => unknown) | undefined;
  onTouched: (() => unknown) | undefined;
  presentingElement = this.ionRouterOutlet.nativeEl;

  constructor(
    // private ImageCropModalService: ImageCropModalService,

    private sharedFilesService: SharedFilesService,
    private readonly ionRouterOutlet: IonRouterOutlet
  ) {
    this.fileIdGetter = inject(FileIdGetterToken, { optional: true });
  }
  ngAfterViewInit(): void {
    this.sharedFilesService.sharedMediaP.then((sf) => {
      // this.sharedFiles = sf
      this.sharedFilesInfo = this.extendAllSharedFiles(sf);
    });
  }

  notifyValueChange(): void {
    if (this.onChange) {
      this.onChange(this.value);
    }
  }

  ngOnInit(): void {}

  writeValue(obj: ProductThumpsProperties): void {
    this._value = obj;
    this.ImgIdsOrdered = Object.keys(obj || {});

    // this.formimages = obj || [];
    this.oldThumbsProperties = obj || {};
    this.newThumbsProperties = {};
    // this.newUrls = [];
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

  // public async deleteRemovedImages() {
  //   const removeProm = this.removedUrls.map((imgurl) => this.removeImageFile(imgurl));
  //   return await Promise.all(removeProm);
  // }
  // public async deleteUnSubmittedImages() {
  //   const removeProm = this.newUrls.map((imgurl) =>
  //     this.removeImageFile(imgurl)
  //   );
  //   return await Promise.all(removeProm).then(() => true);
  // }
  // cleanResources(){
  //   return Promise.all([this.deleteRemovedImages(), this.deleteUnSubmittedImages()])
  // }

  onThumbsPropertiesChanged(imgInfo: FileInfo, thumbsMeta: ImageMeta[]) {
    const temp: ProductThumpsProperties = {};
    temp[imgInfo.docId] = thumbsMeta;
    this.newThumbsProperties = { ...this.newThumbsProperties, ...temp };
  }
  onDownloadUrlChange(resFile: FileInfo, file: FileInfo, files: FileInfo[]) {
    // const urls =
    // dont call this method if the file already added
    // when switching to slide mode, a new uploadTasComponent is created for the same file
    // when the iploadTask completed before the old uploadTasComponent get distroyed and unsubscribed
    // then the onDownloadUrlChange is triggered twice
    // const url = resFile.downloadUrl;
    // if (this.newUrls.indexOf(url) >= 0) {
    //   return;
    // }
    const i = files.indexOf(file);
    if (i != -1) {
      files.splice(i, 1);
      this.uplodedImgFiles.push(resFile);
      const id = resFile.docId;
      const temp: ProductThumpsProperties = {};
      temp[id] = resFile.thumbsMeta;
      this.newThumbsProperties = { ...this.newThumbsProperties, ...temp };
      this.value = { ...this.value, ...this.newThumbsProperties };
    }
    if (files.length === 0 && this.isHaveOpenModal()) {
      this.closeOpenModal();
    }
    // this.newUrls = [...this.newUrls, url];

    // this.form.get('images').patchValue([...this.formimages, url]);
  }
  onUploadCancel(file: FileInfo, files: FileInfo[]) {
    const i = files.indexOf(file);
    files.splice(i, 1);
  }

  onIamgeRemoved(imgID: string) {
    // const i = this.formimages.indexOf(img);
    // if (i >= 0) {
    //   this.formimages.splice(i, 1);
    //   // this.form.get('images').patchValue([...this.formimages]);
    //   this.removedUrls = [...this.removedUrls, img];
    // } else {
    //   const k = this.newUrls.indexOf(img);
    //   if (k >= 0) {
    //     this.newUrls.splice(k, 1);
    //     // this.removeImageFile(img);
    //   } else {
    //     console.log('Image should be either in form urls or form urls');
    //   }
    // }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [imgID]: value, ...wThumbsProperties } = {
      ...this.newThumbsProperties,
    };
    this.newThumbsProperties = wThumbsProperties;
    delete this.value[imgID];
    this.uplodedImgFiles = this.uplodedImgFiles.filter(
      (imgFile) => imgFile.docId != imgID
    );

    this.value = { ...this.value, ...this.newThumbsProperties };
  }

  extendAllSharedFiles(sharedFiles: { file: File; imgUrl: string }[]) {
    return sharedFiles.map((file) => {
      const sharedFileInfo = getExtendedFileData(file.file);
      return sharedFileInfo;
    });
  }

  async onFileSelected($event: Event) {
    // this.afStorage.upload('yu', $event.target.files[0]);
    $event.stopPropagation();
    const target = $event.target as HTMLInputElement;
    console.log(target?.files);

    const extendedFiles = handleFileInputEvent($event);
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

  // removeImageFile(imgurl: string) {
  //   const ref1 = ref(this.storage, imgurl);
  //   console.log('removing image....', ref1.name);
  //   return deleteObject(ref1);
  // }
  openPhotoModal(formimages: FileInfo[] | string[]) {
    this.modalFilesOrImgIds = formimages;
    if (this.modal) {
      // this.modal?.present();
      this.modal.isOpen = true;
    }
  }

  isHaveOpenModal() {
    return this.reorderModal?.isOpen || this.modal?.isOpen;
  }
  closeOpenModal() {
    if (this.reorderModal && this.reorderModal.isOpen) {
      this.reorderModal.isOpen = false;
    } else if (this.modal) {
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
    ev.detail.complete(this.ImgIdsOrdered);
    this.reorderValueObject(this.value);
    this.notifyValueChange();
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
