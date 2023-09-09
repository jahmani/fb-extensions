import {
  Component,
  EventEmitter,
  Input,
  Output,
  forwardRef,
  inject,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TagsInputComponent } from '../TagsInput/tags-input.component';
import {
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { Observable, map, startWith, switchMap } from 'rxjs';
import { WordSuggestionsDataService } from '../../dataServices/word-suggestions-data.service';
import { StoreCustomPropertiesService } from '../../dataServices/store-custom-properties.service';
import {
  AndCompositeQuery,
  productGallaryQuery,
} from '@store-app-repository/app-models';
import { ProductsQueryDataService } from '../../dataServices/products-query-data.service';
import { IonicModule } from '@ionic/angular';

export const PRODUCT_ANDFILTER_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => ProductFilterComponent),
  multi: true,
};

@Component({
  selector: 'store-app-repository-product-filter',
  standalone: true,
  imports: [TagsInputComponent, ReactiveFormsModule, AsyncPipe, IonicModule],
  templateUrl: './product-filter.component.html',
  styleUrls: ['./product-filter.component.scss'],
  providers: [PRODUCT_ANDFILTER_VALUE_ACCESSOR],
})
export class ProductFilterComponent implements ControlValueAccessor {
  selectedWord$: Observable<string[] | null>;
  private suggestionsService = inject(WordSuggestionsDataService);
  private storeCustomPropertiesService = inject(StoreCustomPropertiesService);
  private qs = inject(ProductsQueryDataService);
  suggestions: Observable<string[]>;
  queryForm: FormGroup<{
    namePrefexes: FormControl<string[] | null>;
    customProperties: FormGroup<{ batch: FormControl<string[] | null> }>;
  }>;
  selectedBatchs$: Observable<string[] | null>;
  productBatchsOptionValues$: Observable<string[]>;
  onChange:
    | ((v: unknown | undefined) => void | unknown | undefined)
    | undefined;
  isDisabled = false;
  onTouched:
    | ((v: unknown | undefined) => void | unknown | undefined)
    | undefined;
  // isPopoverOpen = false;
  // popoverEvent: MouseEvent | undefined;

  @Input() set query(val: AndCompositeQuery | null) {
    if (val && val.length) {
      val.forEach((q) => {
        switch (q.fieldPath) {
          case 'namePrefexes':
            this.queryForm.controls.namePrefexes.patchValue(
              (q.value as string).split(' ')
            );
            break;

          case 'customProperties.batch':
            this.queryForm.controls.customProperties.controls.batch.patchValue(
              q.value as string[]
            );
            break;

          default:
            break;
        }
      });
    }
  }
  @Output() queryChange = new EventEmitter<AndCompositeQuery>();

  constructor() {
    this.queryForm = inject(FormBuilder).group({
      namePrefexes: new FormControl<string[] | null>(null),
      customProperties: new FormGroup({
        batch: new FormControl<string[] | null>(null),
      }),
    });
    this.queryForm.valueChanges.subscribe((formValue) => {
      const andQuery = this.fromFormValue(formValue);
      if (this.onChange) {
        this.onChange(andQuery);
      }
      this.queryChange.emit(andQuery);
    });
    this.selectedWord$ = this.queryForm.controls.namePrefexes.valueChanges;
    this.suggestions = this.selectedWord$.pipe(
      switchMap((val) => {
        let prefex = 'zeroWord';
        if (val && val.length) {
          prefex = val.join(' ');
        }
        const suggestions = this.suggestionsService
          .doc$(prefex)
          .pipe(map((s) => (s ? s.suggestions.map((s) => s.suggestion) : [])));
        return suggestions;
      })
    );

    this.selectedBatchs$ =
      this.queryForm.controls.customProperties.controls.batch.valueChanges.pipe(
        map((tags) => {
          if (tags && tags.length) {
            return tags;
          }
          return [];
        }),
        startWith([])
      );

    const batchCustomOptionsDoc =
      this.storeCustomPropertiesService.getProductBatchsOptions();
    this.productBatchsOptionValues$ = batchCustomOptionsDoc;
  }

  private fromFormValue(
    formValue: Partial<{
      namePrefexes: string[] | null;
      customProperties: Partial<{ batch: string[] | null }>;
    }>
  ) {
    let andQuery: AndCompositeQuery = [];
    if (formValue.namePrefexes?.length) {
      andQuery = [
        {
          type: 'where',
          fieldPath: 'namePrefexes',
          opStr: 'array-contains',
          value: formValue.namePrefexes.join(' '),
        },
      ];
    }
    if (formValue.customProperties?.batch?.length) {
      andQuery = [
        ...andQuery,
        {
          type: 'where',
          fieldPath: 'customProperties.batch',
          opStr: 'in',
          value: formValue.customProperties?.batch,
        },
      ];
    }
    return andQuery;
  }

  // showPopover(e: MouseEvent) {
  //   this.popoverEvent = e;
  //   this.isPopoverOpen = true;
  // }
  // onPopoverDismiss() {
  //   this.isPopoverOpen = false;
  // }
  async saveQuery() {
    const q = this.fromFormValue(this.queryForm.value);
    if (q && q.length) {
      this.qs.create({
        query: q,
        name: 'new',
      } as unknown as productGallaryQuery);
    }
  }

  writeValue(obj: AndCompositeQuery | null): void {
    this.query = obj;
  }
  registerOnChange(
    fn: (v: unknown | undefined) => void | unknown | undefined
  ): void {
    this.onChange = fn;
  }
  registerOnTouched(
    fn: (v: unknown | undefined) => void | unknown | undefined
  ): void {
    this.onTouched = fn;
    // throw new Error('Method not implemented.');
  }
  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    // throw new Error('Method not implemented.');
  }
}
