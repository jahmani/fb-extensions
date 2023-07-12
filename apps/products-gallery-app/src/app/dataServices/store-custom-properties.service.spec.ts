import { TestBed } from '@angular/core/testing';

import { StoreCustomPropertiesService } from './store-custom-properties.service';

describe('StoreCustomPropertiesService', () => {
  let service: StoreCustomPropertiesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StoreCustomPropertiesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
