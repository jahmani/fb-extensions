import { TestBed } from '@angular/core/testing';

import { GallaryHelperDocsDataService } from './gallary-helper-docs-data.service';

describe('GallaryHelperDocsDataService', () => {
  let service: GallaryHelperDocsDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GallaryHelperDocsDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
