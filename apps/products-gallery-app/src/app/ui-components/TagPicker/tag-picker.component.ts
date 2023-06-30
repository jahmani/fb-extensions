import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'store-app-repository-tag-picker',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './tag-picker.component.html',
  styleUrls: ['./tag-picker.component.scss'],
})
export class TagPickerComponent implements OnInit {

  isFocused = false;
  @Input({required: true}) tags: string[] = [];
  @Output() tagSelected = new EventEmitter<string>();
  @Output() pickerFocus = new EventEmitter<boolean>();
  @Input() selectedTags: string[] = [];
  constructor() { }

  ngOnInit(): void {
  }

  setFocused(){
    this.isFocused = true;
    this.pickerFocus.emit(true)
  }
  onMouseDown(event: TouchEvent, wraper: HTMLDivElement){
    wraper.focus({preventScroll:true})
  }

}


