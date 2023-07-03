import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageCropModalComponent } from './image-crop-modal.component';

describe('ImageCropModalComponent', () => {
  let component: ImageCropModalComponent;
  let fixture: ComponentFixture<ImageCropModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageCropModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageCropModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
