import { TestBed } from '@angular/core/testing';

import { WordSuggestionsDataService } from './word-suggestions-data.service';

describe('WordSuggestionsDataService', () => {
  let service: WordSuggestionsDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WordSuggestionsDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
