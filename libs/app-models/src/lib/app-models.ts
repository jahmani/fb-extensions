import type {  Timestamp, DocumentData  } from '@angular/fire/firestore';
import type { UserInfo } from '@angular/fire/auth';


export function appModels(): string {
  return 'app-models';
}

export interface Editable extends WithId {
  firstCreatedOn: Timestamp;
  lastEditedOn: Timestamp;
  lastEditedByUserId: string;
}
export type FirebaseIdString = string;
export interface WithId extends Extendable {
  id: FirebaseIdString;
}
export interface Extendable extends DocumentData {
  ext?: Extension;
}
export interface Extension {
  [prop: string]: unknown
}
export interface imageMeta {width: number, height:number}
export interface productImagesMeta {[imageId: FirebaseIdString]: imageMeta}

export interface ProductVariant {
  subName: string;
  id: FirebaseIdString;
  tags: string[];
  sizes: string[];
  colors: string[];
  imageIds: FirebaseIdString[];
  modelNos: string[];
  price: number;
  costPrice: number;
  note: string;
}

export interface Product extends Editable, Extendable {
  name: string;
  price: number;
  brand: string;
  costPrice: number;
  note: string;
  modelNos: string[];
  sizes: string[];
  colors: string[];
  imageIds: FirebaseIdString[];
  imagesMeta: productImagesMeta;
  tags: string[];
  balance: number;
  origin: string;
  variants: {[id:FirebaseIdString]: ProductVariant};
}


export interface User extends WithId {
  uid: FirebaseIdString;
  email: string;
  displayName: string;
  username: string;
  photoURL: string;
  emailVerified: boolean;
  phoneNumber: string;
  providerData: UserInfo[];
  tokens?: string[];
}

export interface Store extends Editable {
  name: string;
  productGalleries: ProductGallery[];
  productPhotos: ProductPhoto[];
}
export interface ProductGallery extends Editable {
  name: string;
  products: Product[];
}

export interface ProductPhoto extends Editable {
  contentType: string;
  downloadUrl: string;
  metadata: {
    firebaseStorageDownloadTokens: string;
    aspectRatio: number;
    height: number;
    width: number;
    size: number;
    originalFileName: string;
  }
  refCount: number;
  linkedProducts: FirebaseIdString[];
}