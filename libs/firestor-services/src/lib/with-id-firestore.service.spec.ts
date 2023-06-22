import { TestBed } from '@angular/core/testing';

import { WithIdFirestoreService } from './with-id-firestore.service';

describe('WithIdFirestoreService', () => {
  let service: WithIdFirestoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WithIdFirestoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
