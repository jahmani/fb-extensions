import { FileInfo, ProductDocTags } from "../app-models";

export function tagsObjectToTagsArray(tagsObject: ProductDocTags) {
    if (tagsObject) {
      return Object.keys(tagsObject).reduce<string[]>((prev, cur) => {
        prev.push(cur);
        return prev;
      }, []);
    }
    return null;
  }

  export 
  function tagsArrayToTagsObj(tagsArray: string[]) {
    let tagsObj;
    if (tagsArray) {
      tagsObj = tagsArray.reduce<{
        [tagWord: string]: boolean;
      }>((prev, cur) => {
        prev[cur] = true;
        return prev;
      }, {});
    }
    return tagsObj;
  }

  export function isStringArraysEqual(a: string[], b: string[]) {
    return a.join() == b.join();
}



export function getExtendedFileData(file: File): FileInfo{
  const { name, type, size } = file;
  const ext = getFileExtension(name);
  const fileUrl =  URL.createObjectURL(file)
  return { name, type, size, ext, file, fileUrl } as FileInfo;
}

export function getFileExtension(fname: string) {
  // tslint:disable-next-line:no-bitwise
  let ext = fname.slice((fname.lastIndexOf(".") - 1 >>> 0) + 2);
  if (ext === 'jpg'){
    ext = 'jpeg';
  }

  return ext; // ? "." + ext : ext;
}

export function objectToLowerCase(data: object){
  const newData =  Object.fromEntries(Object.entries(data).map(
    ([key, value]) => [key, typeof value == 'string' ? value.toLowerCase() : value]));
    return newData;
}

