import {
  Component,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
  ViewChild,
  Input,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  Storage,
  ref,
  percentage,
  uploadBytesResumable,
  getDownloadURL,
} from '@angular/fire/storage';
import { Product, imageMeta } from '@store-app-repository/app-models';
import { AsyncPipe, Location, NgFor, NgIf } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ProductsDataService } from '../../dataServices/products-data.service';
import { WordSuggestionsDataService } from '../../dataServices/word-suggestions-data.service';
import { TagsInputComponent } from '../../ui-components/TagsInput/tags-input.component';
import { Observable, firstValueFrom, map, of, startWith, switchMap } from 'rxjs';
import { GallaryHelperDocsDataService } from '../../dataServices/gallary-helper-docs-data.service';
import { storeIdToken } from '../../app.routes';

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
    NgIf
  ],
})
export class EditProductPageComponent implements AfterViewInit {
  @ViewChild(TagsInputComponent) tagsInputComponent:
    | TagsInputComponent
    | undefined;
  suggestions: Observable<string[]> | undefined;
  selectedWord$: Observable<string> | undefined;
  addNew =true;

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
      if (product) {
        this.productForm.patchValue(product);
        const productNameWords = product.name.split(' ');
        this.tagsInputComponent?.setValue(productNameWords);
      } else{
        console.log('product not fount');
      }
    }


  }
  

  @Output() saveProduct: EventEmitter<Product> = new EventEmitter<Product>();
  injectedStoreId = inject(storeIdToken);
  storeId = this.injectedStoreId; // "tHP7s3ysRD4IU45Z0j8N"
  private productsService = inject(ProductsDataService);
  private gallaryHelperDocsDataService = inject(GallaryHelperDocsDataService);
  private location = inject(Location)
  suggestionsService = inject(WordSuggestionsDataService);

  productForm: FormGroup;
  imagesArray: FormArray;
  selectedImageSrc: string | ArrayBuffer | null | undefined;
  imgProperties: imageMeta | undefined;
  selectedFile: File | undefined;
  imageIdsArray: FormArray;
  productTags: Observable<string[]>;

  constructor(
    private formBuilder: FormBuilder = inject(FormBuilder),
    private storage: Storage = inject(Storage)
  ) // private firestore: Firestore = inject(Firestore)
  {
    this.productForm = this.formBuilder.group({
      
      name: ['', Validators.required],
      id: ['', Validators.required],
      price: ['', Validators.required],
      brand: [''],
      costPrice: [''],
      notice: [''],
      modelNo: [''],
      size: [''],
      color: [''],
      images: this.formBuilder.array([]),
      imageIds: this.formBuilder.array([]),
      imagesInfo: this.formBuilder.array([]),
      tags: [''],
      balance: ['', Validators.required],
      origin: [''],
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

  removeImage(index: number) {
    this.imagesArray.removeAt(index);
  }

  removeImageId(index: number) {
    this.imageIdsArray.removeAt(index);
  }

  imgLoaded(evt: any) {
    if (evt && evt.target) {
      const target: HTMLImageElement = evt.target;
      this.imgProperties = this.getHtmlImageDimentions(target);
      this.uploadImage();
    }
  }

  getHtmlImageDimentions(target: HTMLImageElement) {
    const width = target.naturalWidth;
    const height = target.naturalHeight;
    const portrait = height > width ? true : false;
    const aspectRatio = width / height;
    const imgProperties = { width: width, height: height };
    console.log(
      width,
      height,
      'portrait: ',
      portrait,
      'aspectRatio = ',
      aspectRatio
    );
    return imgProperties;
  }

  readImgFile(event: any) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    const file = files?.item(0);
    if (!file) {
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedImageSrc = reader.result;
    };

    reader.readAsDataURL(file);
  }
  async uploadImage() {
    const file = this.selectedFile as File;
    const fileExt = file.name.split('.').pop();
    // const productPhotosCollection = collection(this.firestore, `stores/${this.storeId}/productPhotos`)
    // const newImageId = doc(productPhotosCollection).id;
    const newImageId = await this.productsService.getNewDocId();
    const filePath = `stores/${this.storeId}/productPhotos/${newImageId}${
      fileExt && '.' + fileExt
    }`;
    const fileRef = ref(this.storage, filePath);
    const task = uploadBytesResumable(fileRef, file, {
      customMetadata: {
        originalFileName: file.name,
        width: this.imgProperties?.width + '',
        height: this.imgProperties?.height + '',
      },
    });

    percentage(task).subscribe((percentage) => {
      console.log(`Upload progress: ${percentage}%`);
    });

    task.then(() => {
      // const fileRef = ref(this.storage,filePath);
      const downloadURL$ = getDownloadURL(fileRef);
      downloadURL$.then((url) => {
        this.imagesArray.push(this.formBuilder.control(url));
        this.imageIdsArray.push(this.formBuilder.control(newImageId));
      });
    });
  }

  saveProductToFirestore(product: Product) {
    // const productsCollection = collection(this.firestore,`stores/${this.storeId}/galleries/default/products` )
    // const productDocRef = doc(productsCollection);
    // const productPath = doc(productsCollection).path;
    const namePrefexes = product.name.split(' ') || [];
    product.tags = product.tags || [];

    if (namePrefexes.length) {
      let namePrefex = ''
      for (let index = 1; index < namePrefexes.length; index++) {
        namePrefex = namePrefexes[index-1] + ' ' + namePrefexes[index];
        namePrefexes[index] = namePrefex;
      }
    }

    product.namePrefexes = namePrefexes;    

    const prom =this.addNew ? this.productsService.create(product) : this.productsService.update(product);
      // setDoc(productDocRef,product)
     return prom.then(() => {
        console.log('Product saved successfully.');
        this.location.back();
        //   this.productForm.reset();
        //   this.imagesArray.clear();
      })
      .catch((error) => {
        console.error('Error saving product:', error);
      });
  }
  deleteProduct(productId: string){
    return this.productsService.delete(productId).then(()=>{
      this.location.back();
    })
  }
}
