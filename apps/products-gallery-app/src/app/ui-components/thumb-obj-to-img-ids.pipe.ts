import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'thumbObjToImgIds',
  standalone: true,
})
export class ThumbObjToImgIdsPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
