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
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';

import {
  FileInfo,
  FirebaseIdString,
  Product,
  // ImageMeta,
  SortableProductThumpsProperties,
  ProductThumpsProperties,
} from '@store-app-repository/app-models';

import { AsyncPipe, Location, NgFor, NgIf } from '@angular/common';
import { AlertButton, IonicModule } from '@ionic/angular';
import { ProductsDataService } from '../../dataServices/products-data.service';
import { WordSuggestionsDataService } from '../../dataServices/word-suggestions-data.service';
import { TagsInputComponent } from '../../ui-components/TagsInput/tags-input.component';
import {
  Observable,
  Subject,
  firstValueFrom,
  map,
  startWith,
  // of,
  // startWith,
  switchMap,
} from 'rxjs';
// import { GallaryHelperDocsDataService } from '../../dataServices/gallary-helper-docs-data.service';
import { productGalleryIdToken, storeIdToken } from '../../app.routes';
import { FormPhotoControlComponent } from '../../ui-components/FormPhotoControl/form-photo-control.component';
import { TransformCtrlValueByDirective } from '../../ui-components/transform-ctrl-value-by.directive';
import { StoreCustomPropertiesService } from '../../dataServices/store-custom-properties.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export const FileIdGetterToken = new InjectionToken<
  (fileInfo: FileInfo) => Promise<FirebaseIdString>
>('FileIdGetterToken');
const getIdFactor = () => {
  const ps = inject(ProductsDataService);
  return async () => {
    const newImageId = await ps.getNewDocId();
    return newImageId;
  };
};
// export type ControlsOf<T extends Record<string, any>> = {
//   [K in keyof T]: T[K] extends Record<any, any>
//     ? FormGroup<ControlsOf<T[K]>>
//     : FormControl<T[K]>;
// };
// interface Profile {
//   firstName: string;
//   lastName: string;
//   address?: {
//     street: string;
//     city: string;
//   };
// }

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
    TransformCtrlValueByDirective,
  ],
  providers: [{ provide: FileIdGetterToken, useFactory: getIdFactor }],
})
export class EditProductPageComponent implements AfterViewInit {
  // @ViewChild(TagsInputComponent) tagsInputComponent:
  //   | TagsInputComponent
  //   | undefined;

  @ViewChild(FormPhotoControlComponent) formPhotoComponent:
    | FormPhotoControlComponent
    | undefined;
  suggestions: Observable<string[]> | undefined;
  selectedWord$: Observable<string> | undefined;
  addNew = true;
  batchOptions: Observable<string[] | undefined>;
  showLeaveEditWarning = false;
  productToUpdate: Product | undefined;
  productForm: FormGroup<{
    name: FormControl<string>;
    id: FormControl<string>;
    price: FormControl<number | undefined>;
    brand: FormControl<string>;
    costPrice: FormControl<number | undefined>;
    note: FormControl<string>;
    modelNos: FormControl<string[] | undefined>;
    sizes: FormControl<string[] | undefined>;
    colors: FormControl<string[] | undefined>;
    // images: new FormControl(undefined, {nonNullable:true}),
    imageIds: FormControl<string[] | undefined>;
    thumbProperties: FormControl<ProductThumpsProperties | undefined>;
    // tags: new FormControl(undefined, {nonNullable:true}),
    balance: FormControl<number | undefined>;
    origin: FormControl<string | undefined>;
    customProperties: FormGroup<{ batch: FormControl<string | undefined> }>;
  }>;
  sortableProductThumpsPropertiesCtrl: FormControl<
    SortableProductThumpsProperties[] | null | undefined
  >;
  namePartsInputCtrl: FormControl<string[] | null | undefined>;

  // private _productId: string;
  @Input() set productId(value: string) {
    // this._productId = value;
    this.intializeForm(value);
  }

  async intializeForm(productID: string) {
    if (productID === 'new') {
      this.addNew = true;
    } else {
      this.addNew = false;
      const product = await firstValueFrom(
        this.productsService.doc$(productID)
      );
      if (product?.customProperties && product.customProperties['batch']) {
        product.customProperties['batch'] = [
          product.customProperties['batch'],
        ] as unknown as string;
      }
      if (product) {
        const s = this.toSortableThumbPropertiesArray(
          product.imageIds,
          product.thumbProperties
        );
        this.sortableProductThumpsPropertiesCtrl.patchValue(s);

        this.productForm.patchValue({ ...product });
        const productNameWords = product.name?.split(' ') || [];
        this.namePartsInputCtrl.patchValue(productNameWords);

        // this.tagsInputComponent?.setValue(productNameWords);
        this.productToUpdate = product;
      } else {
        console.log('product not fount');
      }
    }
  }

  @Output() saveProduct: EventEmitter<Product> = new EventEmitter<Product>();
  storeId = inject(storeIdToken);
  gallaryId = inject(productGalleryIdToken); // "tHP7s3ysRD4IU45Z0j8N"
  private productsService = inject(ProductsDataService);
  // private gallaryHelperDocsDataService = inject(GallaryHelperDocsDataService);
  private location = inject(Location);
  suggestionsService = inject(WordSuggestionsDataService);
  storeCustomPropertiesService = inject(StoreCustomPropertiesService);

  // imagesArray: FormArray;
  // selectedImageSrc: string | ArrayBuffer | null | undefined;
  // imgProperties: ImageMeta | undefined;
  // selectedFile: File | undefined;
  // imageIdsArray: FormArray;
  // productTags: Observable<string[]>;

  constructor() {
    // formBuilder: FormBuilder = inject(FormBuilder) // private firestore: Firestore = inject(Firestore) // private storage: Storage = inject(Storage)
    // const profileForm = new FormGroup<ControlsOf<Profile>>({
    //   firstName: new FormControl('', { nonNullable: true }),
    //   lastName: new FormControl('', { nonNullable: true }),
    //   address: new FormGroup({
    //     street: new FormControl('', { nonNullable: true }),
    //     city: new FormControl('', { nonNullable: true })
    //   })
    // });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    this.sortableProductThumpsPropertiesCtrl = new FormControl<
      SortableProductThumpsProperties[] | undefined
    >(undefined);
    this.namePartsInputCtrl = new FormControl<string[] | undefined>([]);
    this.productForm = new FormGroup({
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      id: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      price: new FormControl<number | undefined>(undefined, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      brand: new FormControl<string>('', { nonNullable: true }),
      costPrice: new FormControl<number | undefined>(undefined, {
        nonNullable: true,
      }),
      note: new FormControl('', { nonNullable: true }),
      modelNos: new FormControl<string[] | undefined>(undefined, {
        nonNullable: true,
      }),
      sizes: new FormControl<string[] | undefined>(undefined, {
        nonNullable: true,
      }),
      colors: new FormControl<string[] | undefined>(undefined, {
        nonNullable: true,
      }),
      // images: new FormControl(undefined, {nonNullable:true}),
      imageIds: new FormControl<string[] | undefined>(undefined, {
        nonNullable: true,
      }),
      thumbProperties: new FormControl<ProductThumpsProperties | undefined>(
        undefined,
        { nonNullable: true }
      ),
      // tags: new FormControl(undefined, {nonNullable:true}),
      balance: new FormControl<number | undefined>(undefined, {
        nonNullable: true,
      }),
      origin: new FormControl<string | undefined>(undefined, {
        nonNullable: true,
      }),
      customProperties: new FormGroup({
        batch: new FormControl<string | undefined>('', { nonNullable: true }),
      }),
    });

    // this.imagesArray = this.productForm.get('images') as FormArray;
    // this.imageIdsArray = this.productForm.get('imageIds') as FormArray;

    // const productTagsDoc = this.gallaryHelperDocsDataService.getProductTags();
    // this.productTags = productTagsDoc.pipe(
    //   map((ptd) => {
    //     if (ptd) {
    //       return Object.keys(ptd.tags).map((key) => ptd.tags[key].tagWord);
    //     } else {
    //       return [];
    //     }
    //   })
    // );

    const batchCustomOptionsDoc =
      this.storeCustomPropertiesService.getProductBatchsOptions();
    this.batchOptions = batchCustomOptionsDoc;

    this.namePartsInputCtrl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) =>
        this.productForm.controls['name'].patchValue(v?.join(' ') || '')
      );
    this.sortableProductThumpsPropertiesCtrl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((thumbPropertiesArray) => {
        if (thumbPropertiesArray) {
          const { imageIds, thumbProperties } =
            this.toThumbPropertiesObject(thumbPropertiesArray);
          this.productForm.controls['thumbProperties'].patchValue(
            thumbProperties
          );
          this.productForm.controls['imageIds'].patchValue(imageIds);
        }
      });
  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.

    // if (this.tagsInputComponent) {
    //   this.selectedWord$ = this.tagsInputComponent.tagsInputChange.pipe(
    //     map((tags) => {
    //       console.log(tags);
    //       // return (tags as string || 'zeroWord');
    //       if (tags && tags.length) {
    //         const str = (tags as string[]).join(' ');
    //         this.productForm.controls['name'].patchValue(str);
    //         return str;
    //       } else {
    //         return 'zeroWord';
    //       }
    //     }),
    //     startWith('zeroWord')
    //   );
    // } else {
    //   this.selectedWord$ = of('zeroWord');
    // }

    this.selectedWord$ = this.namePartsInputCtrl.valueChanges.pipe(
      startWith(this.namePartsInputCtrl.value),
      map((tags) => {
        return tags?.join(' ') || 'zeroWord';
      })
    );

    this.suggestions = this.selectedWord$.pipe(
      switchMap((val) => {
        const suggestions = this.suggestionsService
          .doc$(val)
          .pipe(map((s) => (s ? s.suggestions.map((s) => s.suggestion) : [])));
        return suggestions;
      })
    );
  }

  trasformBatchValue(arg: string[]) {
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

  saveProductToFirestore(product: Partial<Product>) {
    // const productsCollection = collection(this.firestore,`stores/${this.storeId}/galleries/default/products` )
    // const productDocRef = doc(productsCollection);
    // const productPath = doc(productsCollection).path;
    if (this.formPhotoComponent?.isBussy()) {
      this.formPhotoComponent.alertBussy();
      return false;
    }

    product.storeId = this.storeId;
    product.productGalleryId = this.gallaryId;

    if (product.customProperties) {
      if (product.customProperties['batch']) {
        product.customProperties['batch'] =
          this.trasformBatchValue(
            product.customProperties['batch'] as unknown as string[]
          ) || null;
      }
    }
    product.name = product.name?.trim().toLocaleLowerCase();
    if (product.brand) {
      product.brand = product.brand.trim().toLocaleLowerCase();
    }
    if (product.modelNos) {
      product.modelNos = product.modelNos.map((m) => m.trim().toLowerCase());
    }

    const nameWords = product.name?.split(' ') || [];
    product.tags = product.tags || [];
    const namePrefexes = this.getNamePrefexes(nameWords);
    product.namePrefexes = namePrefexes;
    // const nameParts = product.name.split(' ') || [];

    // const namePArtsObj = Object.assign<{[partNo:string]: string},string[]>({},nameParts)
    // product.nameParts= namePArtsObj;

    let prom;
    if (this.addNew) {
      prom = this.productsService.create(product as Product);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // const {firstCreatedOn, id, ...updateProd} = {... product};
      if (this.productToUpdate) {
        product.firstCreatedOn = this.productToUpdate.firstCreatedOn;
      }
      prom = this.productsService.update(product);
    }

    // setDoc(productDocRef,product)
    return prom
      .then(() => {
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
  private getNamePrefexes(
    nameWords: string[],
    namePrefexes?: string[]
  ): string[] {
    namePrefexes = namePrefexes || [];
    if (nameWords.length) {
      // namePrefexes.push(nameWords[0]);
      let namePrefex = '';
      for (let index = 1; index <= nameWords.length; index++) {
        namePrefex = nameWords.slice(0, index).join(' ');
        namePrefexes.push(namePrefex);
      }

      return this.getNamePrefexes(nameWords.slice(1), namePrefexes);
    }
    // if ((nameWords.length - 1)) {
    //   const nextWords = nameWords.slice(1);
    //   const nexPrefexes = this.getNamePrefexes(nextWords);
    //   return [...namePrefexes, ...nexPrefexes];
    // }
    return namePrefexes;
  }

  deleteProduct(productId: string) {
    return this.productsService.delete(productId).then(() => {
      this.productForm.reset();
      this.location.back();
    });
  }

  toThumbPropertiesObject(metas: SortableProductThumpsProperties[]) {
    const imageIds = metas.map((meta) => meta.imageId);
    const thumbProperties = metas.reduce<ProductThumpsProperties>(
      (prev, cur) => {
        prev[cur.imageId] = cur.metas;
        return prev;
      },
      {} as ProductThumpsProperties
    );
    return { imageIds, thumbProperties };
  }
  toSortableThumbPropertiesArray(
    ids: string[] | undefined,
    thumbPropertiesObject: ProductThumpsProperties | undefined
  ) {
    if (ids && thumbPropertiesObject) {
      const sortableMetas = ids.reduce<SortableProductThumpsProperties[]>(
        (prev, cur, i) => {
          prev.push({
            imageId: cur,
            metas: thumbPropertiesObject[cur],
            index: i + 1,
          });
          return prev;
        },
        [] as SortableProductThumpsProperties[]
      );
      return sortableMetas;
    } else {
      return [];
    }
  }

  canDeactivate() {
    if (
      this.formPhotoComponent &&
      (this.formPhotoComponent.isHaveOpenModal() ||
        this.formPhotoComponent.isHaveOpenUploadTaskModal())
    ) {
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
  showLeaveEditWarningSubject = new Subject<boolean>();
  public alertButtons: AlertButton[] = [
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
