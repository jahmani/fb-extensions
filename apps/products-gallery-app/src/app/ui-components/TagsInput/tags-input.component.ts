import {
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnInit,
  Output,
  // ViewChild,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { IonicModule, AlertInput } from '@ionic/angular';
import { TagPickerComponent } from '../TagPicker/tag-picker.component';

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
})
export class TagsInputComponent implements ControlValueAccessor, OnInit {
  @HostBinding('className') myTheme = 'tit-border-color';
  @HostBinding('className') myTheme2 = 'ion-tags-input';
  @HostBinding('style.border-bottom-color')
  @HostBinding('class.active')
  _isFocus = false;
  readonly tagInputCtrl = new FormControl<string | null>('');
  @HostBinding('class.readonly') @Input() set readonly(val: boolean) {
    if (val) {
      this.tagInputCtrl.disable();
    } else {
      this.tagInputCtrl.enable();
    }
  }

  @Input() once = false;
  @Input() maxTags = -1;
  @Input() placeholder = 'بحث';
  @Input() separatorStr = ',';
  @Input() canEnterAdd = true;
  @Input() showInputCtrl = true;
  @Input() showTagsBar = true;
  @Input() label = 'ألأسم';
  @Input() canBackspaceRemove = true;
  @Input() verifyMethod: ((tagSrt: string) => boolean) | undefined;
  tagsBarVisable = false;
  isInputJustBlured = false;
  timer: NodeJS.Timeout | undefined;

  private _suggestions: string[] = [];
  @Input() set suggestions(val: string[]) {
    this._suggestions = val;
    this.filterSelectedSuggestions();
  }
  filteredSuggestion: string[] = [];

  private filterSelectedSuggestions() {
    const searchString = this._editTag?.trim().toLowerCase();
    const filterSelected =
      this._suggestions?.filter(
        (t) =>
          this._tags?.indexOf(t) === -1 &&
          (!searchString || (searchString && t.indexOf(searchString) > -1))
      ) || undefined;
    this.filteredSuggestion = filterSelected;
  }

  @Output() tagsInputChange: EventEmitter<string[]> = new EventEmitter();
  @Output() ionFocus: EventEmitter<unknown> = new EventEmitter();
  @Output() ionBlur: EventEmitter<unknown> = new EventEmitter();
  // @ViewChild('tagsInput', { read: HTMLInputElement }) input:
  //   | HTMLInputElement
  //   | undefined;

  set _editTag(v: string) {
    this.tagInputCtrl.setValue(v);
  }
  get _editTag() {
    return this.tagInputCtrl.value || '';
  }
  _tags: Array<string> = [];
  _onChanged: ((_: unknown) => void) | undefined;
  _onTouched: ((_: unknown) => void) | undefined;
  cssColor: string | null = null;

  constructor() {}

  ngOnInit(): void {}

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
    const val = this._editTag;
    if (val && val.endsWith(' ')) {
      this.keyAddTag();
    }
  }
  onSuggestionClicked(t: string) {
    console.log(t);
    t = t.trim();
    const tagIndex = this._tags.indexOf(t);
    if (tagIndex !== -1) {
      this.removeTag(tagIndex);
    } else {
      if (this.maxTags === 1) {
        this._tags = [];
        // this._editTag = '';
        this.pushTag(t);
      } else {
        this._editTag = t;
        this.keyAddTag();
      }
    }
  }

  separatorStrAddTag() {
    const lastIndex = this._editTag.length - 1;
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

  keyRemoveTag() {
    if (!this.canBackspaceRemove) {
      return;
    }
    if (this._editTag === '') {
      this.removeTag(-1);
    }
  }

  btnRemoveTag($index: number) {
    this.removeTag($index);
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

  pushTag(tagStr: string) {
    if (this.maxTags !== -1 && this._tags.length >= this.maxTags) {
      this._editTag = '';
      return;
    }
    this._tags.push(tagStr.trim());
    this._editTag = '';
    this.emitChanges();
  }

  removeTag($index: number) {
    if (this._tags.length > 0) {
      if ($index === -1) {
        this._tags.pop();
        this.emitChanges();
      } else if ($index > -1) {
        this._tags.splice($index, 1);
        this.emitChanges();
      }
    }
  }

  isOnce(tagStr: string): boolean {
    const tags = this._tags;
    return tags.every((e) => e !== tagStr);
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

  // public focus() {
  //   if (!this._isFocus) {
  //     this._isFocus = true;
  //     this.input?.focus();
  //     this.ionFocus.emit(this._tags);
  //   }
  // }
  onPickerFocused() {
    // if input elemnt was the last element focused before this , kepp the flag _isfocused = true
    if (this.isInputJustBlured) {
      this._isFocus = true;
    }
    console.log('onPickerFocused');
  }
  writeValue(val: string[]): void {
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

  setValue(val: string[] | null) {
    // if val is undefined , assighn null to  this._tags
    // since undefined isnt allowed as firebase property value
    this._tags = val || [];
    if (this._tags) {
      this.emitChanges();
    }
  }

  private emitChanges() {
    this.tagsInputChange.emit(this._tags);
    this._onChanged && this._onChanged(this._tags);
    // }
    this.filterSelectedSuggestions();
  }

  isAlertOpen = false;
  public alertInputs: AlertInput[] = [
    {
      type: 'text',
      placeholder: 'tag (max 16 characters)',
      handler: (input) => {
        console.log(input);
      },
      attributes: {
        maxlength: 16,
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
      handler: (values: unknown[]) => {
        const res = values[0] as string;
        if (res && res.indexOf(' ') === -1) {
          this.pushTag(res);
          return true;
        }
        console.log(values);
        return false;
      },
    },
  ];

  setResult() {
    this.isAlertOpen = false;
  }
}
