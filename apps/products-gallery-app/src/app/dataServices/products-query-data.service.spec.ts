import { TestBed } from '@angular/core/testing';

import { ProductsQueryDataService } from './products-query-data.service';

describe('ProductsQueryDataService', () => {
  let service: ProductsQueryDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductsQueryDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
