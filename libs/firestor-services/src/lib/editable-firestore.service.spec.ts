import { TestBed } from '@angular/core/testing';

import { EditableFirestoreService } from './editable-firestore.service';

describe('EditableFirestoreService', () => {
  let service: EditableFirestoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditableFirestoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
