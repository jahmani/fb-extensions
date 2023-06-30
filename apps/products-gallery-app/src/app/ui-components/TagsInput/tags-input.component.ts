import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  FormGroup,
  FormBuilder,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  Platform,
  AlertController,
  IonicModule,
  AlertInput,
} from '@ionic/angular';
import { PickerId } from '@store-app-repository/app-models';
import { TagPickerComponent } from '../TagPicker/tag-picker.component';
export const TAG_COLORS = new Map([
  ['default', '#4a8bfc'],
  ['secondary', '#32db64'],
  ['danger', '#f53d3d'],
  ['warn', '#ffc125'],
  ['gray', '#767676'],
  ['purple', '#7e60ff'],
  ['dark', '#222'],
  ['light', '#bcbcbc'],
]);

export const PICKER_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => TagsInputComponent),
  multi: true,
};

@Component({
  selector: 'store-app-repository-tags-input',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, TagPickerComponent],
  providers: [PICKER_VALUE_ACCESSOR],
  templateUrl: './tags-input.component.html',
  styleUrls: ['./tags-input.component.scss'],
  // host: {
  //   // class: 'tit-border-color ion-tags-input',
  //   // '[style.border-bottom-color]': '_isFocus ? cssColor : null',
  //   // '[class.active]': '_isFocus',
  //   // '[class.readonly]': 'readonly'
  // },
  encapsulation: ViewEncapsulation.None,
})
export class TagsInputComponent implements ControlValueAccessor, OnInit {
  @HostBinding('className') myTheme = 'tit-border-color';
  @HostBinding('className') myTheme2 = 'ion-tags-input';
  @HostBinding('style.border-bottom-color')
  public get value(): string | null {
    return this.ionFocus ? this.cssColor : null;
  }
  @HostBinding('class.active') _isFocus = false;
  @HostBinding('class.readonly') @Input() readonly = false;

  _once = false;
  @Input() mode = '';
  // @Input() readonly = false;
  @Input() hideRemove = false;
  @Input() maxTags = -1;
  @Input() placeholder = 'بحث';
  // @Input()
  // type: 'text' | 'array' = 'text';
  @Input() separatorStr = ',';
  @Input() canEnterAdd = true;
  @Input() showInputCtrl = true;
  @Input() label = 'ألأسم';
  timer: NodeJS.Timeout | undefined;
  // emitString  = false as const;
  private _suggestions: string[] = [];
  _pickerId: PickerId | undefined;
  isInputJustBlured = false;
  @Input() set suggestions(val: string[]) {
    this._suggestions = val;
    this.filterSelectedSuggestions();
  }
  // @Input() set pickerId(id: PickerId) {
  //   this._pickerId = id;
  //   this.pickerOptionsFirestore.getOptions(id).subscribe((val: unknown[]) => {
  //     const list = val.map((f) => f.label);
  //     this.suggestions = list;
  //   });
  // }
  @Input() canBackspaceRemove = true;
  @Input() verifyMethod: ((tagSrt: string) => boolean) | undefined;
  tagsBarVisable = false;

  tagForm: FormGroup;
  filteredSuggestion: string[] = [];
  private filterSelectedSuggestions() {
    const selectedTagsAsString = this._tags?.join(' ') || '';
    const searchString = this.input?.nativeElement?.value || null;
    // const filterNotMatchedWithInput =this._suggestions.filter((t)=> t.indexOf(searchString) > -1 );
    const filterSelected =
      this._suggestions?.filter(
        (t) =>
          selectedTagsAsString.indexOf(t) === -1 &&
          (!searchString || t.indexOf(searchString) > -1)
      ) || [];
    this.filteredSuggestion = filterSelected;
  }

  @Input()
  set color(value: string) {
    // eslint-disable-next-line no-prototype-builtins
    if (TAG_COLORS.has(value)) {
      this.cssColor = TAG_COLORS.get(value) || null;
    } else {
      this.cssColor = value;
    }
  }
  @Input()
  set once(value: boolean | string) {
    if (typeof value === 'string') {
      this._once = true;
    } else {
      this._once = value;
    }
  }
  get once(): boolean | string {
    return this._once;
  }

  @Output() tagsInputChange: EventEmitter<string[]> = new EventEmitter();
  @Output() ionFocus: EventEmitter<unknown> = new EventEmitter();
  @Output() ionBlur: EventEmitter<unknown> = new EventEmitter();
  @ViewChild('tagsInput') input: any;

  set _editTag(v: string) {
    this.tagInputCtrl.setValue(v);
  }
  get _editTag() {
    return this.tagInputCtrl.value as string;
  }
  _tags: Array<string> = [];
  _onChanged: ((_: unknown) => void) | undefined;
  _onTouched: ((_: unknown) => void) | undefined;
  cssColor: string | null = null;

  constructor(
    public plt: Platform,
    public ref: ChangeDetectorRef,
    fb: FormBuilder,
    // private pickerOptionsFirestore: PickerOptionsFirestoreService,
    private alertController: AlertController
  ) {
    this.tagForm = fb.group({
      tag: '',
    });
  }

  get tagInputCtrl() {
    return this.tagForm.controls['tag'];
  }

  ngOnInit(): void {
    setTimeout(() => {
      // this.focus();
    }, 200);
    if (this.mode === '') {
      this.plt.ready().then(() => {
        this.initMode();
      });
    }
  }

  keyAddTag() {
    const tagStr = this._editTag.trim();
    if (!this.canEnterAdd) {
      return;
    }
    if (!this.verifyTag(tagStr)) {
      return;
    }
    if (this.once && !this.isOnce(tagStr)) {
      this._editTag = '';
      return;
    }
    this.pushTag(tagStr);
  }
  onInput($event: unknown) {
    console.log('Input Event: ', $event);
    this.filterSelectedSuggestions();
    const val: string = this.input.nativeElement.value;
    if (val.endsWith(' ')) {
      this.keyAddTag();
    }
  }
  onSuggestionClicked(t: string) {
    console.log(t);
    const tagIndex = this._tags.indexOf(t);
    if (tagIndex !== -1) {
      this.removeTag(tagIndex);
    } else {
      if (this.maxTags === 1) {
        this._tags = [t.trim()];
        this.ref.detectChanges();
        this.emitChanges();
      } else {
        this._editTag = t;
        this.keyAddTag();
      }
    }

    this.filterSelectedSuggestions();
  }
  separatorStrAddTag(): any {
    const lastIndex: number = this._editTag.length - 1;
    let tagStr = '';
    if (!this.separatorStr) {
      return;
    }

    if (this._editTag[lastIndex] === this.separatorStr) {
      tagStr = this._editTag.split(this.separatorStr)[0].trim();

      if (this.verifyTag(tagStr) && this.isOnce(tagStr)) {
        this.pushTag(tagStr);
      } else {
        this._editTag = '';
      }
    }
  }

  keyRemoveTag(): any {
    if (!this.canBackspaceRemove) {
      return;
    }
    if (this._editTag === '') {
      this.removeTag(-1);
      // this._editTag = '';
    }
  }

  btnRemoveTag($index: number): any {
    this.removeTag($index);
    this.filterSelectedSuggestions();
  }

  verifyTag(tagStr: string): boolean {
    if (typeof this.verifyMethod === 'function') {
      if (!this.verifyMethod(tagStr)) {
        this._editTag = '';
        return false;
      } else {
        return true;
      }
    }

    if (!tagStr.trim()) {
      this._editTag = '';
      return false;
    } else {
      return true;
    }
  }

  pushTag(tagStr: string): any {
    if (this.maxTags !== -1 && this._tags.length >= this.maxTags) {
      this._editTag = '';
      return;
    }
    this._tags.push(tagStr.trim());
    this.ref.detectChanges();
    this.emitChanges();
    // this.onChange.emit(this._tags);
    // this._onChanged(this._tags);

    this._editTag = '';
    this.filterSelectedSuggestions();
  }

  removeTag($index: number): any {
    if (this._tags.length > 0) {
      if ($index === -1) {
        this._tags.pop();
        // this.onChange.emit(this._tags);
        // this._onChanged(this._tags);
        this.emitChanges();
      } else if ($index > -1) {
        this._tags.splice($index, 1);
        // this.onChange.emit(this._tags);
        // this._onChanged(this._tags);
        this.emitChanges();
      }
    }
  }

  isOnce(tagStr: string): boolean {
    const tags: string[] = this._tags;
    return tags.every((e: string): boolean => e !== tagStr);
  }

  @HostListener('click', ['$event'])
  _click(ev: UIEvent) {
    // if (!this._isFocus) {

    // }
    //this.focus(); // dont auto focus once tag chip is clicked
    ev.preventDefault();
    ev.stopPropagation();
  }
  onInputFocus() {
    this._isFocus = true; // indicate that input is focused
    this.tagsBarVisable = true;
    clearTimeout(this.timer);
  }

  public blur() {
    if (this._isFocus) {
      this.timer = setTimeout(() => {
        this.tagsBarVisable = false;
      }, 100);
      this._isFocus = false;
      // temp flag SHOULD BE TRUE if input elemet blured an dtag picker focused directly
      this.isInputJustBlured = true;
      setTimeout(() => {
        this.isInputJustBlured = false;
      }, 100);
      this.ionBlur.emit(this._tags);
    }
  }

  public focus() {
    if (!this._isFocus) {
      this._isFocus = true;
      this.input.nativeElement.focus();
      this.ionFocus.emit(this._tags);
    }
  }
  onPickerFocused() {
    // if input elemnt was the last element focused before this , kepp the flag _isfocused = true
    if (this.isInputJustBlured) {
      this._isFocus = true;
    }
    console.log('onPickerFocused');
  }
  writeValue(val: string[]): void {
    // let tags = val;
    // if (typeof val === 'string') {
    //   val = val.trim();
    //   if (val.length) {
    //     tags = val.split(' ');
    //   } else {
    //     tags = [];
    //   }
    //   this.emitString = true;
    // } else if (this.type === 'text') {
    //   this.emitString = true;
    // } else if (this.type === 'array') {
    //   this.emitString = false;
    // }

    this._tags = val || [];

    this.filterSelectedSuggestions();
  }

  registerOnChange(fn: (_: unknown) => void): void {
    this._onChanged = fn;
    this.setValue(this._tags);
  }

  registerOnTouched(fn: ((_: unknown) => void) | undefined): void {
    this._onTouched = fn;
  }

  setValue(val: string[] | null): any {
    // if val is undefined , assighn null to  this._tags
    // since undefined isnt allowed as firebase property value
    this._tags = val || [];
    if (this._tags) {
      this.emitChanges();
      // if (this.maxTags === 1) {
      //   this._onChanged(this._tags[0]);
      // } else {
      //   this._onChanged(this._tags);
      // }
    }
  }

  private emitChanges() {
    // if (this.emitString) {
    //   let resultString;
    //   // if (this.type) {
    //   //   if (this.type === 'text') {
    //   //     resultString = this._tags.join(' ');
    //   //   } else {
    //   //     // if this._tags is undefined , assighn null to resultString
    //   //     // since undefined isnt allowed as firebase property value
    //   //     resultString = this._tags || null;
    //   //   }
    //   // } else {
    //   //   if (this.maxTags === 1) {
    //   //     resultString = this._tags.join(' ');
    //   //   } else {
    //   const  result = this._tags || null;
    //   //   }
    //   // }

    //   this.tagsInputChange.emit(result);
    //   this._onChanged && this._onChanged(result);
    // } else {
    this.tagsInputChange.emit(this._tags);
    this._onChanged && this._onChanged(this._tags);
    // }
    this.filterSelectedSuggestions();
  }

  initMode() {
    this.mode = this.plt.is('ios')
      ? 'ios'
      : this.plt.is('android')
      ? 'md'
      : this.plt.is('desktop')
      ? 'mp'
      : 'md';
  }
  onTermSelected(t: unknown) {
    console.log(t);
  }
  // async onNewOption() {
  //   if (this._pickerId) {
  //     const label = await this.presentAlert();
  //     if (label) {
  //       const option: PickerOption = { label };
  //       this.pickerOptionsFirestore
  //         .addOption(this._pickerId, option)
  //         .then(() => {
  //           this.onSuggestionClicked(label);
  //         });
  //     }
  //   }
  // }
  isAlertOpen = false;
  public alertInputs: AlertInput[] = [
    {
      placeholder: 'tag (max 8 characters)',
      handler: (input) =>{
        console.log(input);
      },
      attributes: {
        maxlength: 8,
      },
    },
  ];
  public alertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
    },
    {
      text: 'OK',
      role: 'confirm',
      handler: (values: any)=>{
        const res = values[0] as string;
        if (res && res.indexOf(' ') === -1) {
          this.pushTag(values[0]);
          return true;
        }
        console.log(values)
        return false;
      }
    },
  ];

  setResult(ev: any) {
    this.isAlertOpen = false;

 }

  // async presentAlert() {
  //   const alert = await this.alertController.create({
  //     header: 'Please enter your info',
  //     buttons: ['OK'],
  //     inputs: [
  //       {
  //         placeholder: 'option label (max 18 characters)',
  //         attributes: {
  //           maxlength: 18,
  //         },
  //       },
  //     ],
  //   });
  //   const promise = alert.onDidDismiss().then((val) => {
  //     if (val.data) {
  //       return val.data.values[0];
  //     }
  //   });
  //   alert.present();
  //   return promise;
  // }
}
