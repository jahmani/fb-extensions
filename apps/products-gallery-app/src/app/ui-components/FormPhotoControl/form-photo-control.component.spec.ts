import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormPhotoControlComponent } from './form-photo-control.component';

describe('FormPhotoControlComponent', () => {
  let component: FormPhotoControlComponent;
  let fixture: ComponentFixture<FormPhotoControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormPhotoControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormPhotoControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
