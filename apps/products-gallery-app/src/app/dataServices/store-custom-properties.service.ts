import { Injectable, inject } from '@angular/core';
import { CustomPropery } from '@store-app-repository/app-models';
import { EditableFirestoreService } from '@store-app-repository/firestor-services';
import { storeIdToken, productGalleryIdToken } from '../app.routes';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'any'
})
export class StoreCustomPropertiesService extends EditableFirestoreService<CustomPropery> {

  storeId = inject(storeIdToken);
  photoGalaryId = inject(productGalleryIdToken, {optional:true}) || 'default'
  override _basePath = `stores/${this.storeId}/storeCustomProperties`;
  docsMap = new Map<string, Observable<CustomPropery | undefined>>();
  constructor() {
    super();
    
  }
  getProductBatchsOptions(){
    return this.doc$('batch').pipe(map(v=>{
      const entries = Object.entries(v?.options || {}).filter(e=> !!e[1].freq ).sort((a,b) => (b[1]?.lastEditedOn?.seconds|| 0) - (a[1]?.lastEditedOn?.seconds|| 0)  )
      return entries.map(e=> e[0]);
      // const options = Object.keys(v?.options || {})
      // return options;
    }));;
  }
  override doc$(id: string): Observable<CustomPropery | undefined> {
      return this.docsMap.get(id) || super.doc$(id);;
  }
}