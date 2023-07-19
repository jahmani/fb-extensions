import { TestBed } from '@angular/core/testing';

import { AppUserInfoService } from './app-user-info.service';

describe('AppUserInfoService', () => {
  let service: AppUserInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppUserInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
