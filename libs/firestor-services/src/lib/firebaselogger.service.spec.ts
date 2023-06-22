import { TestBed } from '@angular/core/testing';

import { FirebaseloggerService } from './firebaselogger.service';

describe('FirebaseloggerService', () => {
  let service: FirebaseloggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirebaseloggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
