import { TestBed } from '@angular/core/testing';

import { GallaryUsersDataService } from './gallary-users-data.service';

describe('GallaryUsersDataService', () => {
  let service: GallaryUsersDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GallaryUsersDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
