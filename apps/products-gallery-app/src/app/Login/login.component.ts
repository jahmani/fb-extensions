import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {
  Auth,
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from '@angular/fire/auth';
import { AppUserInfoService } from '../dataServices/app-user-info.service';
import { take } from 'rxjs';
import { AppUser } from '@store-app-repository/app-models';

@Component({
  selector: 'store-app-repository-login',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  auth = inject(Auth);
  appUserInfoService = inject(AppUserInfoService);
  googleLogIn() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access Google APIs.
        if (!result) {
          return;
        }
        const credential = GoogleAuthProvider.credentialFromResult(result);
        let token;
        if (credential) {
          token = credential.accessToken;
        }
        // The signed-in user info.
        const user = result.user;
        // IdP data available using getAdditionalUserInfo(result)
        this.appUserInfoService
          .doc$(user.uid)
          .pipe(take(1))
          .subscribe((u) => {
            if (u) {
              console.log("already exist")
            } else {
              const userDTO: AppUser = {
                uid: user.uid,
                displayName: user.displayName || undefined,
                email: user.email || undefined,
                photoURL: user.photoURL || undefined,
                id: user.uid,                
              } as AppUser;
              this.appUserInfoService.create(userDTO);
            }
          });
        console.log(user, token);
        // ...
      })
      .catch((error) => {
        console.log(error);
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });
  }
  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    getRedirectResult(this.auth)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access Google APIs.
        if (!result) {
          return;
        }
        const credential = GoogleAuthProvider.credentialFromResult(result);
        let token;
        if (credential) {
          token = credential.accessToken;
        }
        // The signed-in user info.
        const user = result.user;
        // IdP data available using getAdditionalUserInfo(result)
        console.log(user, token);
        // ...
      })
      .catch((error) => {
        console.log(error);
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });
  }
}
