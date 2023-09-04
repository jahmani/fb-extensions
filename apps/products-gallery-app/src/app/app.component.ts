import { Component, OnInit, inject } from '@angular/core';
import { RouterLinkActive, RouterLink, Router } from '@angular/router';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FirebaseUserService } from './authServices/firebase-user.service';
import {
  FirebaseloggerService,
  disableNetworkPeriodToken,
} from '@store-app-repository/firestor-services';

@Component({
  selector: 'store-app-repository-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    NgFor,
    NgIf,
    RouterLinkActive,
    RouterLink,
    NgClass,
    AsyncPipe,
  ],
  providers: [
    {
      provide: disableNetworkPeriodToken,
      useValue: 2000,
    },
  ],
})
export class AppComponent implements OnInit {
  fbUserService = inject(FirebaseUserService);
  router = inject(Router);
  isOnline$ = inject(FirebaseloggerService).realNetworkStatus;
  showMoreOfflinePrompt = false;

  public appPages = [
    { title: 'users', url: 'users', icon: 'people' },
    { title: 'Outbox', url: '/folder/outbox', icon: 'paper-plane' },
    { title: 'Favorites', url: '/folder/favorites', icon: 'heart' },
    { title: 'Archived', url: '/folder/archived', icon: 'archive' },
    { title: 'Trash', url: '/folder/trash', icon: 'trash' },
    { title: 'Spam', url: '/folder/spam', icon: 'warning' },
  ];
  public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];
  constructor() {}
  ngOnInit(): void {
    // this.fbUserService.currentAuthStatus.subscribe((user=>{
    //   if (!user) {
    //     this.router.navigate(['login']);
    //   }
    // }))
  }
}
