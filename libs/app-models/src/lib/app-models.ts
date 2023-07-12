import type { Timestamp, DocumentData } from '@angular/fire/firestore';
import type { UserInfo } from '@angular/fire/auth';
import { EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import type {UploadTaskSnapshot, UploadTask, StorageReference} from '@angular/fire/storage'
import type { CropperPosition, ImageTransform, OutputFormat } from 'ngx-image-cropper';
import { SafeResourceUrl } from '@angular/platform-browser';

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
export interface ImageMeta {
  subName: string;
  width: number;
  height: number;
}
export interface ProductThumpsProperties {
  [imageId: FirebaseIdString]: ImageMeta[];
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
export interface CustomProperyOption{
  value: string;
  freq: number;
  lastEditedOn?: Timestamp
}
export interface CustomPropery extends Editable, Extendable {
  name: string,
  options: CustomProperyOption[];
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
  nameParts: {[partNumber:string]:string};
  modelNos: string[];
  price?: number;

  brand: string;
  costPrice?: number;
  note: string;
  sizes: string[];
  colors: string[];
  origin?: string;

  imageIds?: FirebaseIdString[];
  thumbProperties?: ProductThumpsProperties;
 
  tags?: string[]
  balance?: number;
  variants: { [id: FirebaseIdString]: ProductVariant };

  customProperties: { [cpName: string]: string | number | null };
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
  ext: OutputFormat;
  file: File;
  imageMeta: ImageMeta
  thumbsMeta: ImageMeta[]
  docId: FirebaseIdString,
  croppeDataBlob?: Blob;
  croppedData?: string;
  downloadUrl: string;
  uploadTaskData: UploadTaskComponentData;
  cropperData? :{
    position: CropperPosition;
    cropperTransformData? :  ImageTransform;

  }
}

export interface SharedFile {
  file: File;
  imgUrl: string;
}

export interface UploadTaskComponentData{
  dataUri: string;
  fileData: string | ArrayBuffer;
  lImgInfo: FileInfo;
  safeDataUrl: SafeResourceUrl;
  downloadUrlChange : EventEmitter<string>;
  cancel : EventEmitter<boolean>;
  task: UploadTask;

  percentage: Observable<number>;
  snapshot: Observable<{ ref: StorageReference;
    snap: UploadTaskSnapshot; }>;
  downloadURL: string;
}
