import { TestBed } from '@angular/core/testing';

import { LasyFirestoreProviderService } from './lasy-firestore-provider-service';

describe('LasyFirestoreProviderServiceService', () => {
  let service: LasyFirestoreProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LasyFirestoreProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
