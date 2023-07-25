import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GallaryUsersDataService } from '../../dataServices/gallary-users-data.service';
import { IonicModule } from '@ionic/angular';
import { FirebaseUserService } from '../../authServices/firebase-user.service';
import { ProductGalleryUser, RawAppUser } from '@store-app-repository/app-models';

@Component({
  selector: 'store-app-repository-gallary-users',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './gallary-users.component.html',
  styleUrls: ['./gallary-users.component.scss'],
})
export class GallaryUsersComponent {
  gallaryUsersDataService = inject(GallaryUsersDataService)
  users$ = this.gallaryUsersDataService.getAllDocs$();
  fbUser = inject(FirebaseUserService);
  addCurrentUser(){
    const user = this.fbUser.getCurrentUser();
    if (user) {
      const RawAppUser : RawAppUser ={
        uid: user.uid,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
      }
      this.gallaryUsersDataService.create({userInfo:RawAppUser, role:'owner'} as ProductGalleryUser, user.uid)
    }
  }
}
