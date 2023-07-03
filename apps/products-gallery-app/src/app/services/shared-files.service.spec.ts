import { TestBed } from '@angular/core/testing';

import { SharedFilesService } from './shared-files.service';

describe('SharedFilesService', () => {
  let service: SharedFilesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedFilesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
