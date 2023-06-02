import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditProductPageComponent } from './edit-product.page';

const routes: Routes = [
  {
    path: '',
    component: EditProductPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditProductPageRoutingModule {}
