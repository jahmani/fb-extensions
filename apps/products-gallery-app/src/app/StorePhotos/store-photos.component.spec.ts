import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StorePhotosComponent } from './store-photos.component';

describe('StorePhotosComponent', () => {
  let component: StorePhotosComponent;
  let fixture: ComponentFixture<StorePhotosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorePhotosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StorePhotosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
