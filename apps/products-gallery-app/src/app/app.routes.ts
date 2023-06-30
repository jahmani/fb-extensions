import { Route } from '@angular/router';
import { InjectionToken, inject } from '@angular/core';
import { ActivatedRoute, } from '@angular/router';

export const storeIdToken = new InjectionToken<string>('store id');
export const productGalleryIdToken = new InjectionToken<string>('productGalleryIdToken');

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'store/tHP7s3ysRD4IU45Z0j8N/products',
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
        path: 'edit-product/:productId',
        
        loadComponent: () =>
          import('./Products/edit-product/edit-product.page').then(
            (m) => m.EditProductPageComponent
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

