import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditProductPageRoutingModule } from './edit-product-routing.module';

import { EditProductPageComponent } from './edit-product.page';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    EditProductPageRoutingModule,
  ],
  declarations: [EditProductPageComponent],
  exports:[EditProductPageComponent]
})
export class EditProductPageModule {}
