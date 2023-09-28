import { TestBed } from '@angular/core/testing';

import { StorePhotosDataService } from './store-photos-data.service';

describe('StorePhotosDataService', () => {
  let service: StorePhotosDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorePhotosDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
