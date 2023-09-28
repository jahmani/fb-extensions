import { Route, Router, UrlTree } from '@angular/router';
import { InjectionToken, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthGuard, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import { Auth, getAuth, user } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { FirebaseUserService } from './authServices/firebase-user.service';

export const storeIdToken = new InjectionToken<string>('store id');
export const productGalleryIdToken = new InjectionToken<string>(
  'productGalleryIdToken'
);
function componentCanDeactivate(component: any) {
  component.canDeactivate ? component.canDeactivate() : true;
}
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

  { path: 'share/image', redirectTo: 'store/tHP7s3ysRD4IU45Z0j8N/products' },
  {
    path: 'store/:id',
    providers: [
      {
        provide: storeIdToken,
        useFactory: () => {
          const activatedRout = inject(ActivatedRoute);
          const id = activatedRout.snapshot.firstChild?.paramMap.get('id');
          return id;
        },
      },
      {
        provide: productGalleryIdToken,
        useValue: 'default',
      },
    ],
    canActivate: [
      () => {
        const firebaseUserService = inject(FirebaseUserService);
        const router = inject(Router);
        const res = firebaseUserService.fastUser$.pipe(
          map((u) => {
            if (u) {
              return true;
            } else {
              return router.createUrlTree(['login']);
            }
          })
        );
        return res;
      },
    ],
    data: { authGuardPipe: redirectUnauthorizedTo(['login']) },
    children: [
      {
        path: 'edit-product/:productId',
        canDeactivate: [
          (component: any) =>
            component.canDeactivate ? component.canDeactivate() : true,
        ],

        loadComponent: () =>
          import('./ProductGallary/edit-product/edit-product.page').then(
            (m) => m.EditProductPageComponent
          ),
      },
      {
        path: 'photos',
        loadComponent: () =>
          import('./StorePhotos/store-photos.component').then(
            (m) => m.StorePhotosComponent
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import(
            './ProductGallary/product-gallary/product-gallary.component'
          ).then((m) => m.ProductGallaryComponent),
        canDeactivate: [componentCanDeactivate],
      },
      {
        path: 'products/:productId',
        loadComponent: () =>
          import(
            './ProductGallary/product-gallary/product-gallary.component'
          ).then((m) => m.ProductGallaryComponent),
        canDeactivate: [componentCanDeactivate],
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./ProductGallary/GallaryUsers/gallary-users.component').then(
            (m) => m.GallaryUsersComponent
          ),
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./Login/login.component').then((m) => m.LoginComponent),
  },
];
