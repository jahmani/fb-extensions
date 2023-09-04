import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductsSlidesViewComponent } from './products-slides-view.component';

describe('ProductsSlidesViewComponent', () => {
  let component: ProductsSlidesViewComponent;
  let fixture: ComponentFixture<ProductsSlidesViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsSlidesViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsSlidesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
