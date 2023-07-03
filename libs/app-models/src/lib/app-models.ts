import type { Timestamp, DocumentData } from '@angular/fire/firestore';
import type { UserInfo } from '@angular/fire/auth';
import { EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import type {UploadTaskSnapshot, UploadTask, StorageReference} from '@angular/fire/storage'
export function appModels(): string {
  return 'app-models';
}

export type PickerId =
  | 'brands'
  | 'colors'
  | 'origins'
  | 'sizes'
  | 'units'
  | 'tags';
export interface PickerOptions extends Editable {
  id: PickerId;
  options: PickerOption[];
}
export interface PickerOption {
  label: string;
  value?: string;
  url?: string;
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
export interface StoreDoc {
  storeId: FirebaseIdString;
}
export interface ProductGalleryDoc extends StoreDoc {
  productGalleryId: FirebaseIdString;
}
export interface Extendable extends DocumentData {
  ext?: Extension;
}
export interface Extension {
  [prop: string]: unknown;
}
export interface imageMeta {
  width: number;
  height: number;
}
export interface productImagesMeta {
  [imageId: FirebaseIdString]: imageMeta;
}

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

export interface GallaryHelperDoc extends Editable, Extendable, ProductGalleryDoc {
  id: FirebaseIdString;
}

export interface ProductTag{
  frequency: number; tagWord: string
}
export interface ProductTagDoc extends GallaryHelperDoc {
  tags: {[tagWord:string]: ProductTag};
  id: 'ProductTag';
}
export interface WordSuggestion extends Editable, Extendable, ProductGalleryDoc {
  suggestions: { frequency: number; suggestion: string }[];
  word: string;
}
export interface ProductDocTags{
  [tagWord: string]: boolean
}
export interface Product extends Editable, Extendable, ProductGalleryDoc {
  name: string;
  namePrefexes: string[];
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
  variants: { [id: FirebaseIdString]: ProductVariant };
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
export interface ProductGallery extends Editable, StoreDoc {
  name: string;
  storeId: FirebaseIdString;
  products: Product[];
}

export interface ProductPhoto extends Editable, StoreDoc {
  contentType: string;
  downloadUrl: string;
  metadata: {
    firebaseStorageDownloadTokens: string;
    aspectRatio: number;
    height: number;
    width: number;
    size: number;
    originalFileName: string;
  };
  refCount: number;
  linkedProducts: FirebaseIdString[];
}
export interface FileInfo{
  name: string;
  type: string;
  size: number;
  data?: string;
  ext: string;
  file: File;
  croppeDataBlob?: Blob;
  croppedData?: string;
  uploadTaskData?: UploadTaskComponentData;
  cropperData? :{
    position: CropperPosition;
    cropperTransformData? :  ImageTransform;

  }
}

export interface UploadTaskComponentData{
  dataUri: string;
  fileData: string | ArrayBuffer;
  imgLoaded : boolean;
  lImgInfo: FileInfo;
  safeDataUrl: string;

  downloadUrlChange : EventEmitter<string>;
  cancel : EventEmitter<boolean>;
  task: UploadTask;

  percentage: Observable<number>;
  snapshot: Observable<{ ref: StorageReference;
    snap: UploadTaskSnapshot; }>;
  downloadURL: string;
}
