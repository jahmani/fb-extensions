import { Component, OnInit, inject } from '@angular/core';
import { RouterLinkActive, RouterLink, Router } from '@angular/router';
import { NgFor } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FirebaseUserService } from './authServices/firebase-user.service';
@Component({
    selector: 'store-app-repository-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    standalone: true,
    imports: [
        IonicModule,
        NgFor,
        RouterLinkActive,
        RouterLink,
    ],
})
export class AppComponent implements OnInit {
  fbUserService = inject(FirebaseUserService)
  router = inject(Router);
  public appPages = [
    { title: 'Inbox', url: '/folder/inbox', icon: 'mail' },
    { title: 'Outbox', url: '/folder/outbox', icon: 'paper-plane' },
    { title: 'Favorites', url: '/folder/favorites', icon: 'heart' },
    { title: 'Archived', url: '/folder/archived', icon: 'archive' },
    { title: 'Trash', url: '/folder/trash', icon: 'trash' },
    { title: 'Spam', url: '/folder/spam', icon: 'warning' },
  ];
  public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];
  constructor() {}
  ngOnInit(): void {
    this.fbUserService.currentAuthStatus.subscribe((user=>{
      if (user) {
        this.router.navigate(['']);
      } else {
        this.router.navigate(['login']);
        
      }
    }))
  }
}
