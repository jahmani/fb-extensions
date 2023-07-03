import { AfterViewInit, Component, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { IonModal, IonRouterOutlet, IonicModule } from '@ionic/angular';
import { FileInfo, getExtendedFileData, handleFileInputEvent } from '@store-app-repository/app-models';
import { ref, deleteObject, Storage } from '@angular/fire/storage';
import { UploadTaskComponent } from '../UploadTask/upload-task.component';
import { SharedFilesService } from '../../services/shared-files.service';
import { CommonModule } from '@angular/common';
import { FileIdGetterToken } from '../../Products/edit-product/edit-product.page';

const defaultFileIdGetter =(fileInfo:FileInfo)=>{
  const id = `/${Date.now()}_${fileInfo.name}`;
  return id
}


@Component({
  selector: 'store-app-repository-form-photo-control',
  standalone: true,
  imports: [IonicModule, CommonModule, UploadTaskComponent],
  templateUrl: './form-photo-control.component.html',
  styleUrls: ['./form-photo-control.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => FormPhotoControlComponent),
    multi: true
  }]
})
export class FormPhotoControlComponent implements OnInit, ControlValueAccessor, AfterViewInit {

  // folderPath1 ;

  @Input() folderPath: string | undefined;
  @ViewChild(IonModal) modal: IonModal | undefined;

  files: FileInfo[] = [];
  newUrls: string[] = [];
  removedUrls: string[] = [];
  formimages: string[] = [];
  private _value: any;

  @ViewChild("fileInput") fileInput: ElementRef | undefined;
  @ViewChildren(UploadTaskComponent) allUploadTasksComponents: QueryList<UploadTaskComponent> | undefined

  //  sharedImgUrl: string;
  // sharedFiles: { file: File; imgUrl: string }[]=[];
  showBussyAlert = false;
  sharedFilesInfo: FileInfo[] =[];
  modalImages:  FileInfo[] | string[] = [];
  fileIdGetter: ((fileInfo: FileInfo) => Promise<string>) | null;

  set value(value: string[] ) {
    this._value = value;
    this.notifyValueChange();
  }

  get value(): string[]  {
    return this._value;
  }

  onChange: ((value: unknown) => unknown) | undefined;
  onTouched: (() => unknown) | undefined;
  presentingElement = this.ionRouterOutlet.nativeEl;

  constructor(
    private storage: Storage,

    // private ImageCropModalService: ImageCropModalService,

    private sharedFilesService: SharedFilesService,
    private readonly ionRouterOutlet: IonRouterOutlet,
    ) {
      this.fileIdGetter = inject(FileIdGetterToken, {optional:true})

   }
   ngAfterViewInit(): void {
    this.sharedFilesService.sharedMediaP.then(sf=>{
      // this.sharedFiles = sf
      this.sharedFilesInfo = this.extendAllSharedFiles(sf)
    } );
  }

  notifyValueChange(): void {
    if (this.onChange) {
      this.onChange(this.value);
    }
  }

  ngOnInit(): void {
    this.newUrls = [];

  }

  writeValue(obj: string[] ): void {
    this._value = obj;
    this.formimages = obj || [];
    this.newUrls = [];

  }

  registerOnChange(fn: any): void {
    console.log('registerOnChange')
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    console.log('isDisabled : ', isDisabled);
  }

  public async deleteRemovedImages() {
    const removeProm = this.removedUrls.map((imgurl) => this.removeImageFile(imgurl));
    return await Promise.all(removeProm);
  }
  public async deleteUnSubmittedImages() {
    const removeProm = this.newUrls.map((imgurl) => this.removeImageFile(imgurl));
    return await Promise.all(removeProm).then(() => true);
  }
  // cleanResources(){
  //   return Promise.all([this.deleteRemovedImages(), this.deleteUnSubmittedImages()])
  // }

  onDownloadUrlChange(resFile: FileInfo, file: FileInfo, files: FileInfo[]) {
    // const urls =
    // dont call this method if the file already added
    // when switching to slide mode, a new uploadTasComponent is created for the same file
    // when the iploadTask completed before the old uploadTasComponent get distroyed and unsubscribed
    // then the onDownloadUrlChange is triggered twice 
    const url = resFile.downloadUrl;
    if(this.newUrls.indexOf(url)>=0){
      return;
    }
    const i = files.indexOf(file);
    files.splice(i, 1);
    this.newUrls = [...this.newUrls, url];

    this.value = [...this.formimages, ...this.newUrls];
    // this.form.get('images').patchValue([...this.formimages, url]);
  }
  onUploadCancel(file: any, files: any[]){
    const i = files.indexOf(file);
    files.splice(i, 1);
  }
  
  onIamgeRemoved(img: string) {
    const i = this.formimages.indexOf(img);
    if (i >= 0) {
      this.formimages.splice(i, 1);
      // this.form.get('images').patchValue([...this.formimages]);
      this.removedUrls = [...this.removedUrls, img];
    } else {
      const k = this.newUrls.indexOf(img);
      if (k >= 0) {
        this.newUrls.splice(k, 1);
        this.removeImageFile(img);
      } else {
        console.log("Image should be either in form urls or form urls");
      }
    }

    this.value = [...this.formimages, ...this.newUrls];

  }

  extendAllSharedFiles(sharedFiles: {file: File; imgUrl: string}[]){
    return sharedFiles.map(file=>{
      const sharedFileInfo =  getExtendedFileData(file.file);
      return sharedFileInfo
    })
 }

  async onFileSelected($event: Event) {
    // this.afStorage.upload('yu', $event.target.files[0]);
    $event.stopPropagation();
    const target = $event.target as HTMLInputElement;
    console.log(target?.files);

    const extendedFiles = handleFileInputEvent($event)
      this.files = [...extendedFiles, ...this.files];
      if (this.files.length > 0) {
        this.openPhotoModal(this.files)
      }
    if (this.fileIdGetter) {
      for (let index = 0; index < extendedFiles.length; index++) {
        const file = extendedFiles[index];
        file.docId = await this.fileIdGetter(file)
    }
    }else{
      for (let index = 0; index < extendedFiles.length; index++) {
        const file = extendedFiles[index];
        file.docId = defaultFileIdGetter(file)
    }
    }
    target.value = '';
  }
  openNativeFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  isBussy(): boolean{
    return  !!this.files?.length;
  }

  alertBussy(){
    this.showBussyAlert = true;
  }

  removeImageFile(imgurl: string) {

    const ref1 = ref(this.storage, imgurl);
    console.log("removing image....", ref1.name);
    return deleteObject(ref1);
  }
  openPhotoModal(formimages: FileInfo[] |  string[]){
    this.modalImages = formimages
    this.modal?.present();
  }

  
  haveOpenModal() {
    return this.modal?.isCmpOpen;
  }
  closeOpenModal() {
    if (this.allUploadTasksComponents) {
      
      const array = this.allUploadTasksComponents.toArray();
      for (let index = 0; index < array.length; index++) {
        const uploadTaskComponent = array[index];
        if(uploadTaskComponent.haveOpenModal()){
          uploadTaskComponent.closeOpenModal();
          return;
        }
      }
    }
    return this.modal?.dismiss();
  }

}

