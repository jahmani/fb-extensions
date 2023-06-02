import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FolderPageRoutingModule } from './folder-routing.module';

import { FolderPage } from './folder.page';
import { EditProductPageModule } from '../Products/edit-product/edit-product.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, FolderPageRoutingModule, EditProductPageModule],
  declarations: [FolderPage],
})
export class FolderPageModule {}
