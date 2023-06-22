import { InjectionToken, NgModule, inject } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { map } from 'rxjs';

export const storeIdToken = new InjectionToken<string>('store id');

const routes: Routes = [
  {
    path: '',
    redirectTo: 'store/tHP7s3ysRD4IU45Z0j8N/edit-product',
    pathMatch: 'full',
  },
  {
    path: 'folder/:id',
    loadChildren: () =>
      import('./folder/folder.module').then((m) => m.FolderPageModule),
  },
  {
    path: 'store/:id',
    providers: [
      {
        provide: storeIdToken,
        useFactory:()=>{
          const activatedRout = inject(ActivatedRoute);
          const id = activatedRout.snapshot.firstChild?.paramMap.get('id');
          return id;
      
        }
      },
    ],
    children: [
      {
        path: 'edit-product',
        loadChildren: () =>
          import('./Products/edit-product/edit-product.module').then(
            (m) => m.EditProductPageModule
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./product-gallary/product-gallary.component').then(
            (m) => m.ProductGallaryComponent
          ),
      },
    ],
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
