import { Injectable, inject,  } from '@angular/core';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, combineLatestAll, combineLatestWith, interval, map, share, startWith, take, tap } from 'rxjs';
import { Auth, user } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class FirebaseUserService {
  fbAuth = inject(Auth)
  user = user(this.fbAuth)
  router= inject(Router);

  private authStatusSub = new BehaviorSubject<User|null>(null);
  currentAuthStatus = this.authStatusSub.asObservable();
  readonly WAIT_TIME = 30000 ;
  readonly initializing$ = interval(this.WAIT_TIME).pipe(map(()=>false), startWith(true), take(2), tap(console.log)); // 10 seconds
  fastUser$ = combineLatest([user(this.fbAuth).pipe(startWith(null)), this.initializing$]).pipe(map(([user, isIntializing])=>{
    if (user) {
      return user;
    } else if (isIntializing) {
        const u = this.getStorageUser();
        return u;
      } else {
        return null
      }
    
  }), )
  constructor() {
    onAuthStateChanged(this.fbAuth,(u)=>{
      if (u) {
        this.setStorageUser(u);
      } else {
        this.clearStorageUser();
      }
    })

    this.fastUser$.subscribe(u=>{
      if (!u) {
            this.router.navigate(['login']);

      } 
    })
   }
  getCurrentUser(){
    return this.fbAuth.currentUser;
  }

  getStorageUser(){
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString) as User;
      return user;
    } else {
      return null;
    } 
  }
  setStorageUser(user: User){
    const userString = JSON.stringify(user);
    localStorage.setItem('user', userString)
  }
  clearStorageUser(){
    localStorage.removeItem('user')
  }
}
