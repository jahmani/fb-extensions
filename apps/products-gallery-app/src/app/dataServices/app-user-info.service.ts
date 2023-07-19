import { Injectable } from '@angular/core';
import { AppUser } from '@store-app-repository/app-models';
import { EditableFirestoreService } from '@store-app-repository/firestor-services';

@Injectable({
  providedIn: 'root'
})
export class AppUserInfoService extends EditableFirestoreService<AppUser> {
  override _basePath = `users`;

  constructor() { 
    super();
  }
}
