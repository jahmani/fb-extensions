import { Injectable, inject } from '@angular/core';
import { Auth, User, onAuthStateChanged, user } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseUserService {
  fbAuth = inject(Auth)
  user = user(this.fbAuth)
  private authStatusSub = new BehaviorSubject<User|null>(null);
  currentAuthStatus = this.authStatusSub.asObservable();
  constructor() {
    onAuthStateChanged(this.fbAuth,(u)=>this.authStatusSub.next(u))
   }
  getCurrentUser(){
    this.fbAuth.currentUser;

  }
}
