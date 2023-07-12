import { Directive, HostListener, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[transformCtrlValueBy]',
  standalone: true,
})
export class TransformCtrlValueByDirective {

  @Input({required:true,alias:'transformCtrlValueBy'}) transformer:null | ((qrgs:any)=>unknown ) = null;


  constructor(public ngControl: NgControl) {}

  @HostListener("ngModelChange", ["$event"])
  onModelChange(event: any) {
    if (this.transformer) {
      const newVal = this.transformer(event);
    this.ngControl.control?.setValue(newVal,{emitEvent:false});    
    }

  }

  // transform(value) {
  //   let text = value.toLowerCase();
  //   if (text.charAt(0) == " ") {
  //     text = text.trim();
  //   }
  //   if (text.charAt(text.length - 1) == "-") {
  //     //text = (text.replace(/-/g, ""));
  //   }
  //   text = text.replace(/ +/g, "-");
  //   text = text.replace(/--/g, "-");
  //   text = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, ""); // Note: Normalize('NFKD') used to normalize special alphabets like óã to oa
  //   text = text.replace(/[^a-zA-Z0-9 -]/g, "");

  //   return text;
  // }
}