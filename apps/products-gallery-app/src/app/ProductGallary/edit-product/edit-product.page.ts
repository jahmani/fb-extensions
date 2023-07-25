import {
  Component,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
  ViewChild,
  Input,
  InjectionToken,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';

import { FileInfo, FirebaseIdString, Product, ImageMeta } from '@store-app-repository/app-models';

import { AsyncPipe, Location, NgFor, NgIf } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ProductsDataService } from '../../dataServices/products-data.service';
import { WordSuggestionsDataService } from '../../dataServices/word-suggestions-data.service';
import { TagsInputComponent } from '../../ui-components/TagsInput/tags-input.component';
import { Observable, Subject, firstValueFrom, map, of, startWith, switchMap } from 'rxjs';
import { GallaryHelperDocsDataService } from '../../dataServices/gallary-helper-docs-data.service';
import { productGalleryIdToken, storeIdToken } from '../../app.routes';
import { FormPhotoControlComponent } from '../../ui-components/FormPhotoControl/form-photo-control.component';
import { TransformCtrlValueByDirective } from '../../ui-components/transform-ctrl-value-by.directive';
import { StoreCustomPropertiesService } from '../../dataServices/store-custom-properties.service';

export const FileIdGetterToken = new InjectionToken<(fileInfo:FileInfo)=>Promise<FirebaseIdString>>('FileIdGetterToken', )
const getIdFactor = ()=>{
  const ps = inject(ProductsDataService);
  return async ()=>{
    const newImageId = await ps.getNewDocId();
    return newImageId;

  }

}
export type ControlsOf<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends Record<any, any>
  ? FormGroup<ControlsOf<T[K]>> 
  : FormControl<T[K]>;
};
interface Profile {
  firstName: string;
  lastName: string;
  address?: {
    street: string;
    city: string
  }
}

@Component({
  selector: 'store-app-repository-edit-product-page',
  templateUrl: 'edit-product.page.html',
  styleUrls: ['edit-product.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    ReactiveFormsModule,
    NgFor,
    TagsInputComponent,
    AsyncPipe,
    NgIf, 
    FormPhotoControlComponent,
    TransformCtrlValueByDirective
  ],
  providers:[
    {provide:FileIdGetterToken, useFactory:getIdFactor}
  ]
})
export class EditProductPageComponent implements AfterViewInit {
  @ViewChild(TagsInputComponent) tagsInputComponent:
    | TagsInputComponent
    | undefined;

  @ViewChild(FormPhotoControlComponent) formPhotoComponent: FormPhotoControlComponent | undefined;
  suggestions: Observable<string[]> | undefined;
  selectedWord$: Observable<string> | undefined;
  addNew =true;
  batchOptions: Observable<string[] | undefined>;
  showLeaveEditWarning= false;

  // private _productId: string;
  @Input() set productId(value: string){
    // this._productId = value;
    this.intializeForm(value);
  }

  async intializeForm(productID: string){
    if (productID === 'new') {
      this.addNew = true
    } else{
      this.addNew = false;
      const product = await  firstValueFrom(this.productsService.doc$(productID))
      if (product?.customProperties && product.customProperties['batch']) {
        product.customProperties['batch'] =([product.customProperties['batch']] as unknown as string);
      }
      if (product) {
        this.productForm.patchValue({...product, });
        const productNameWords = product.name.split(' ');
        this.tagsInputComponent?.setValue(productNameWords);
      } else{
        console.log('product not fount');
      }
    }


  }
  

  @Output() saveProduct: EventEmitter<Product> = new EventEmitter<Product>();
  storeId = inject(storeIdToken);
  gallaryId = inject(productGalleryIdToken); // "tHP7s3ysRD4IU45Z0j8N"
  private productsService = inject(ProductsDataService);
  private gallaryHelperDocsDataService = inject(GallaryHelperDocsDataService);
  private location = inject(Location)
  suggestionsService = inject(WordSuggestionsDataService);
  storeCustomPropertiesService = inject(StoreCustomPropertiesService);

  productForm: FormGroup;
  imagesArray: FormArray;
  selectedImageSrc: string | ArrayBuffer | null | undefined;
  imgProperties: ImageMeta | undefined;
  selectedFile: File | undefined;
  imageIdsArray: FormArray;
  productTags: Observable<string[]>;

  constructor(
    private formBuilder: FormBuilder = inject(FormBuilder),
    // private storage: Storage = inject(Storage)
  ) // private firestore: Firestore = inject(Firestore)
  {
    // const profileForm = new FormGroup<ControlsOf<Profile>>({
    //   firstName: new FormControl('', { nonNullable: true }),
    //   lastName: new FormControl('', { nonNullable: true }),
    //   address: new FormGroup({
    //     street: new FormControl('', { nonNullable: true }),
    //     city: new FormControl('', { nonNullable: true })
    //   })
    // });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    this.productForm =  new FormGroup({
      
      name: new FormControl('', {nonNullable:true, validators:[Validators.required]}),
      id: new FormControl('', {nonNullable:true, validators:[Validators.required]}),
      price: new FormControl(undefined, {nonNullable:true, validators:[Validators.required]}),
      brand: new FormControl('', {nonNullable:true}),
      costPrice: new FormControl(undefined, {nonNullable:true}),
      note: new FormControl(undefined, {nonNullable:true}),
      modelNos: new FormControl(undefined, {nonNullable:true}),
      sizes: new FormControl(undefined, {nonNullable:true}),
      colors: new FormControl(undefined, {nonNullable:true}),
      // images: new FormControl(undefined, {nonNullable:true}),
      imageIds: new FormControl(undefined, {nonNullable:true}),
      thumbProperties: new FormControl(undefined, {nonNullable:true}),
      // tags: new FormControl(undefined, {nonNullable:true}),
      balance: new FormControl(undefined, {nonNullable:true}),
      origin: new FormControl(undefined, {nonNullable:true}),
      customProperties: new FormGroup({
        batch: new FormControl('', { nonNullable: true }),
      })
    });

    this.imagesArray = this.productForm.get('images') as FormArray;
    this.imageIdsArray = this.productForm.get('imageIds') as FormArray;

    const productTagsDoc = this.gallaryHelperDocsDataService.getProductTags();
    this.productTags = productTagsDoc.pipe(map(ptd=>{
      if (ptd) {
        return Object.keys(ptd.tags).map(key=> ptd.tags[key].tagWord)
      } else {
        return []
      }
    }))


    const batchCustomOptionsDoc = this.storeCustomPropertiesService.getProductBatchsOptions();
    this.batchOptions = batchCustomOptionsDoc;
  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.


    if (this.tagsInputComponent) {
      this.selectedWord$ = this.tagsInputComponent.tagsInputChange.pipe(
        map((tags) => {
          console.log(tags);
          // return (tags as string || 'zeroWord');
          if (tags && tags.length) {
            const str = (tags as string[]).join(' ');
            this.productForm.controls['name'].patchValue(str);
            return str;
          } else {
            return 'zeroWord';
          }
        }),
        startWith('zeroWord')
      );
    } else {
      this.selectedWord$ = of('zeroWord');
    }
    this.suggestions = this.selectedWord$.pipe(
      switchMap((val) => {
        const suggestions = this.suggestionsService
          .doc$(val)
          .pipe(map((s) => (s ? s.suggestions.map((s) => s.suggestion) : [])));
        return suggestions;
      })
    );
  }

  trasformBatchValue(arg: string[]){
    return arg && arg[0] && arg[0].trim().toLowerCase();
  }

  // removeImage(index: number) {
  //   this.imagesArray.removeAt(index);
  // }

  // removeImageId(index: number) {
  //   this.imageIdsArray.removeAt(index);
  // }

  // imgLoaded(evt: any) {
  //   if (evt && evt.target) {
  //     const target: HTMLImageElement = evt.target;
  //     this.imgProperties = this.getHtmlImageDimentions(target);
  //     this.uploadImage();
  //   }
  // }

  // getHtmlImageDimentions(target: HTMLImageElement) {
  //   const width = target.naturalWidth;
  //   const height = target.naturalHeight;
  //   const portrait = height > width ? true : false;
  //   const aspectRatio = width / height;
  //   const imgProperties = { width: width, height: height };
  //   console.log(
  //     width,
  //     height,
  //     'portrait: ',
  //     portrait,
  //     'aspectRatio = ',
  //     aspectRatio
  //   );
  //   return imgProperties;
  // }

  // readImgFile(event: any) {
  //   const target = event.target as HTMLInputElement;
  //   const files = target.files;
  //   const file = files?.item(0);
  //   if (!file) {
  //     return;
  //   }
  //   this.selectedFile = file;
  //   const reader = new FileReader();
  //   reader.onload = (e) => {
  //     this.selectedImageSrc = reader.result;
  //   };

  //   reader.readAsDataURL(file);
  // }
  // async uploadImage() {
  //   const file = this.selectedFile as File;
  //   const fileExt = file.name.split('.').pop();
  //   // const productPhotosCollection = collection(this.firestore, `stores/${this.storeId}/productPhotos`)
  //   // const newImageId = doc(productPhotosCollection).id;
  //   const newImageId = await this.productsService.getNewDocId();
  //   const filePath = `stores/${this.storeId}/productPhotos/${newImageId}${
  //     fileExt && '.' + fileExt
  //   }`;
  //   const fileRef = ref(this.storage, filePath);
  //   const task = uploadBytesResumable(fileRef, file, {
  //     customMetadata: {
  //       originalFileName: file.name,
  //       width: this.imgProperties?.width + '',
  //       height: this.imgProperties?.height + '',
  //     },
  //   });

  //   percentage(task).subscribe((percentage) => {
  //     console.log(`Upload progress: ${percentage}%`);
  //   });

  //   task.then(() => {
  //     // const fileRef = ref(this.storage,filePath);
  //     const downloadURL$ = getDownloadURL(fileRef);
  //     downloadURL$.then((url) => {
  //       this.imagesArray.push(this.formBuilder.control(url));
  //       this.imageIdsArray.push(this.formBuilder.control(newImageId));
  //     });
  //   });
  // }

  saveProductToFirestore(product: Product) {
    // const productsCollection = collection(this.firestore,`stores/${this.storeId}/galleries/default/products` )
    // const productDocRef = doc(productsCollection);
    // const productPath = doc(productsCollection).path;

    product.storeId = this.storeId;
    product.productGalleryId = this.gallaryId
if (product.thumbProperties) {
      const imgIds = Object.keys(product.thumbProperties);
      product.imageIds = imgIds;
}

if (product.customProperties) {
  if (product.customProperties['batch']) {
    product.customProperties['batch'] = this.trasformBatchValue(product.customProperties['batch'] as unknown as string[]) ||  null
  }
}
product.name = product.name.trim().toLocaleLowerCase();
if (product.brand) {
  product.brand = product.brand.trim().toLocaleLowerCase();
}
if (product.modelNos) {
  product.modelNos = product.modelNos.map(m=>m.trim().toLowerCase());
}

const nameWords = product.name.split(' ') || [];
    product.tags = product.tags || [];
    const namePrefexes = this.getNamePrefexes(nameWords);
    product.namePrefexes = namePrefexes;
    // const nameParts = product.name.split(' ') || [];

    // const namePArtsObj = Object.assign<{[partNo:string]: string},string[]>({},nameParts)
    // product.nameParts= namePArtsObj;


    let prom 
    if (this.addNew ) {
      prom = this.productsService.create(product)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // const {firstCreatedOn, id, ...updateProd} = {... product};
      prom = this.productsService.update(product)

    }

    // setDoc(productDocRef,product)
     return prom.then(() => {
        console.log('Product saved successfully.');
        this.productForm.reset();
        this.location.back();
        //   this.productForm.reset();
        //   this.imagesArray.clear();
      })
      .catch((error) => {
        console.error('Error saving product:', error);
      });
  }
  private getNamePrefexes(nameWords: string[]): string[] {
    const namePrefexes = [];
    if (nameWords.length) {
      namePrefexes[0] = nameWords[0];
      let namePrefex = '';
      for (let index = 1; index < nameWords.length; index++) {
        namePrefex = nameWords[index - 1] + ' ' + nameWords[index];
        namePrefexes[index] = namePrefex;
      }
    }
    // if ((nameWords.length - 1)) {
    //   const nextWords = nameWords.slice(1);
    //   const nexPrefexes = this.getNamePrefexes(nextWords);
    //   return [...namePrefexes, ...nexPrefexes];
    // }
    return namePrefexes;
  }

  deleteProduct(productId: string){
    return this.productsService.delete(productId).then(()=>{
      this.productForm.reset();
      this.location.back();
    })
  }

  canDeactivate(){
    if (this.formPhotoComponent && (this.formPhotoComponent.isHaveOpenModal() || this.formPhotoComponent.isHaveOpenUploadTaskModal())) {
      return this.formPhotoComponent.canDeactivate();
    }
    if (this.formPhotoComponent?.isBussy()) {
      this.formPhotoComponent.alertBussy();
      return false;
    }
    if (this.productForm.dirty) {
      this.showLeaveEditWarning = true;
      return this.showLeaveEditWarningSubject.asObservable();
    }
    return true;
  }
  showLeaveEditWarningSubject = new Subject<boolean>()
  public alertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        this.showLeaveEditWarning = false;
        this.showLeaveEditWarningSubject.next(false);
      },
    },
    {
      text: 'OK',
      role: 'confirm',
      handler: () => {
        this.showLeaveEditWarning = false;
        this.showLeaveEditWarningSubject.next(true);
      },
    },
  ];

}
