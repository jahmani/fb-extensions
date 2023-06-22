import { Component, Output, EventEmitter, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Storage, ref, percentage, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Firestore, doc } from '@angular/fire/firestore';
import { Product, imageMeta } from '@store-app-repository/app-models';
import { collection, setDoc } from 'firebase/firestore';
import { NgFor } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { storeIdToken } from '../../app-routing.module';

@Component({
    selector: 'store-app-repository-edit-product-page',
    templateUrl: 'edit-product.page.html',
    styleUrls: ['edit-product.page.scss'],
    standalone: true,
    imports: [
        IonicModule,
        ReactiveFormsModule,
        NgFor,
    ],
})
export class EditProductPageComponent {
  @Output() saveProduct: EventEmitter<Product> = new EventEmitter<Product>();
  injectedStoreId = inject(storeIdToken);
  storeId = this.injectedStoreId; // "tHP7s3ysRD4IU45Z0j8N"

  productForm: FormGroup;
  imagesArray: FormArray;
  selectedImageSrc: string | ArrayBuffer | null | undefined;
  imgProperties: imageMeta | undefined;
  selectedFile: File | undefined;
  imageIdsArray: FormArray;

  constructor(
    private formBuilder: FormBuilder = inject(FormBuilder),
    private storage: Storage = inject(Storage),
    private firestore: Firestore = inject(Firestore)
  ) {
    this.productForm = this.formBuilder.group({
      name: ['', Validators.required],
      price: ['', Validators.required],
      brand: [''],
      costPrice: [''],
      notice: [''],
      modelNo: [''],
      size: [''],
      color:[''],
      images: this.formBuilder.array([]),
      imageIds: this.formBuilder.array([]),
      imagesInfo: this.formBuilder.array([]),
      tag: [''],
      balance: ['', Validators.required],
      origin: [''],
    });

    this.imagesArray = this.productForm.get('images') as FormArray;
    this.imageIdsArray = this.productForm.get('imageIds') as FormArray;
  }


  removeImage(index: number) {
    this.imagesArray.removeAt(index);
  }

  removeImageId(index: number) {
    this.imageIdsArray.removeAt(index);
  }

  imgLoaded(evt: any){
    if (evt && evt.target) {
      const target: HTMLImageElement = evt.target;
      this.imgProperties = this.getHtmlImageDimentions(target)
      this.uploadImage();
    }
  }

    getHtmlImageDimentions(target: HTMLImageElement){
      const width = target.naturalWidth ;
      const height = target.naturalHeight ;
      const portrait = height > width ? true : false;
      const aspectRatio = width/height;
      const imgProperties = {width: width, height: height};
      console.log(width, height, 'portrait: ', portrait, 'aspectRatio = ', aspectRatio);  
      return imgProperties;
    }

    readImgFile(event: any){
      const target = event.target as HTMLInputElement;
      const files = target.files;
      const file = files?.item(0) ;
      if (!file) {
        return
      }    
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = e => {
        this.selectedImageSrc = reader.result
      };
  
      reader.readAsDataURL(file);
    }
  uploadImage() {

    const file = this.selectedFile as File;
    const fileExt = file.name.split('.').pop()
    const productPhotosCollection = collection(this.firestore, `stores/${this.storeId}/productPhotos`)
    const newImageId = doc(productPhotosCollection).id;
    const filePath = `stores/${this.storeId}/productPhotos/${newImageId}${fileExt && "."+fileExt}`;
    const fileRef = ref(this.storage, filePath);
    const task = uploadBytesResumable(fileRef, file, {customMetadata:{originalFileName: file.name, width:this.imgProperties?.width + '', height: this.imgProperties?.height+'' }});
    

    percentage(task).subscribe((percentage) => {
      console.log(`Upload progress: ${percentage}%`);
    });

    task.then(( )=>{
          // const fileRef = ref(this.storage,filePath);
          const downloadURL$ = getDownloadURL(fileRef);
          downloadURL$.then((url) => {
            this.imagesArray.push(this.formBuilder.control(url));
            this.imageIdsArray.push(this.formBuilder.control(newImageId));
          });
        })
  }

  saveProductToFirestore(product: Product) {
    const productsCollection = collection(this.firestore,`stores/${this.storeId}/galleries/default/products` )
    const productDocRef = doc(productsCollection);
    // const productPath = doc(productsCollection).path;

    setDoc(productDocRef,product)
      .then(() => {
        console.log('Product saved successfully.');
     //   this.productForm.reset();
     //   this.imagesArray.clear();

      })
      .catch((error) => {
        console.error('Error saving product:', error);
      });
  }
}
