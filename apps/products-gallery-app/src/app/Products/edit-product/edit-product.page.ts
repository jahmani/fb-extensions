import { Component, Output, EventEmitter, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Storage, ref, percentage, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Firestore, doc } from '@angular/fire/firestore';
import { Product } from '@store-app-repository/app-models';
import { collection, setDoc } from 'firebase/firestore';

@Component({
  selector: 'store-app-repository-edit-product-page',
  templateUrl: 'edit-product.page.html',
  styleUrls: ['edit-product.page.scss'],
})
export class EditProductPageComponent {
  @Output() saveProduct: EventEmitter<Product> = new EventEmitter<Product>();
  storeId = "tHP7s3ysRD4IU45Z0j8N"
  productForm: FormGroup;
  imagesArray: FormArray;

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
      tag: [''],
      balance: ['', Validators.required],
      origin: [''],
    });

    this.imagesArray = this.productForm.get('images') as FormArray;
  }

  addImage() {
    this.imagesArray.push(this.formBuilder.control(''));
  }

  removeImage(index: number) {
    this.imagesArray.removeAt(index);
  }

  uploadImage(event: any) {
    const file = event.target.files[0];
    const productPhotosCollection = collection(this.firestore, `stores/${this.storeId}/productPhotos`)
    const filePath = `stores/${this.storeId}/productPhotos/${doc(productPhotosCollection).id}`;
    const fileRef = ref(this.storage, filePath);
    const task = uploadBytesResumable(fileRef, file, {customMetadata:{originalFileName: file.name}});
    

    percentage(task).subscribe((percentage) => {
      console.log(`Upload progress: ${percentage}%`);
    });

    task.then(( )=>{
          // const fileRef = ref(this.storage,filePath);
          const downloadURL$ = getDownloadURL(fileRef);
          downloadURL$.then((url) => {
            this.imagesArray.push(this.formBuilder.control(url));
          });
        })
  }

  saveProductToFirestore(product: Product) {
    const storeId = 'YOUR_STORE_ID'; // Replace with the actual store ID
    const productsCollection = collection(this.firestore,`stores/${this.storeId}/products` )
    const productDocRef = doc(productsCollection);
    // const productPath = doc(productsCollection).path;

    setDoc(productDocRef,product)
      .then(() => {
        console.log('Product saved successfully.');
        this.productForm.reset();
      })
      .catch((error) => {
        console.error('Error saving product:', error);
      });
  }
}
