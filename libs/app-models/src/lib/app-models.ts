import {  Timestamp } from '@angular/fire/firestore';


export function appModels(): string {
  return 'app-models';
}

export interface Editable extends WithId {
  firstCreatedOn: Timestamp;
  lastEditedOn: Timestamp;
  lastEditedByUserId: string;
}
export interface WithId extends Extendable {
  id: string;
}
export interface Extendable {
  ext?: Extension;
}
export interface Extension {
  type?: string;
}
export interface Product extends Editable, Extendable {
  name: string;
  price: number;
  brand: string;
  costPrice: number;
  notice: string;
  modelNo: string[];
  size: string[];
  color: string[];
  images: string[];
  tag: string[];
  balance: number;
  origin: string;
}