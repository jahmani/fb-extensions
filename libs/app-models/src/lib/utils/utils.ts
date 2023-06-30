import { ProductDocTags } from "../app-models";

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