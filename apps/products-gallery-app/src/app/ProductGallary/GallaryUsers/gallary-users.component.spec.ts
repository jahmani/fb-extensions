import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GallaryUsersComponent } from './gallary-users.component';

describe('GallaryUsersComponent', () => {
  let component: GallaryUsersComponent;
  let fixture: ComponentFixture<GallaryUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GallaryUsersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GallaryUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
