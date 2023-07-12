import {
  Product,
  // ProductDocTags,
  // ProductTagDoc,
  // isStringArraysEqual,
  // tagsObjectToTagsArray,
} from '../../app-models/src/index';
import * as functions from 'firebase-functions';
import {
  CollectionReference,
  DocumentData,
  FieldValue,
  Timestamp,
  getFirestore,
} from 'firebase-admin/firestore';

const firestore = getFirestore();

interface Suggestion {
  suggestion: string;
  frequency: number;
  lastEditedOn?: Timestamp
}

export const updateWordSuggestions = functions.firestore
  .document('/stores/{storeId}/galleries/{galleryId}/products/{productId}')
  .onWrite(async (change, context) => {
    console.info('try handle name suggestions')

    const storeId = context.params.storeId;
    const galleryId = context.params.galleryId;
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;
    const wordSuggestionsCollection = firestore.collection(
      `/stores/${storeId}/galleries/${galleryId}/wordSuggestions`
    );
    const wordSuggestionsObjectsCollection = firestore.collection(
      `/stores/${storeId}/galleries/${galleryId}/prefexSuggestions`
    );
    // const productTagsHelperDoc = firestore.doc(
    //   `/stores/${storeId}/galleries/${galleryId}/gallaryHelperDocs/productTags`
    // );
    const storeCustomPropertiesHelperColl = firestore.collection(
      `/stores/${storeId}/storeCustomProperties`
    );
    const batch = firestore.batch();
    console.info('try handle name suggestions')
      let allAdded = null, allRemoved = null;

    try {
      if (
        (afterData && !beforeData) ||
        (beforeData && afterData && beforeData.name !== afterData.name)
      ) {
        // Product was added or name changed, update suggestions
        allAdded = getSuggestionsForNewName(afterData.name);
        console.log("all added tSuggs: ", allAdded);

        await handleSuggestionForNewName(
          afterData.name,
          wordSuggestionsCollection,
          batch
        );
      }

      if (
        (!afterData && beforeData) ||
        (beforeData && afterData && beforeData.name !== afterData.name)
      ) {
        allRemoved = getSuggestionsForNewName(beforeData.name);
        console.log("all allRemoved tSuggs: ", allRemoved);
        // Product was deleted or name changed, remove old suggestions
        await removeSuggestions(
          beforeData.name,
          wordSuggestionsCollection,
          batch
        );
      }
    } catch (error) {
      console.error('Error updating word suggestions: ', error);
      throw error;
    }
    console.log('end handle name suggestions')
    

    try {
      console.info('try handleChangedProductCustomProperties')
      console.info('afterData: ', afterData)
      console.info('beforeData: ', beforeData)
      if (
        (afterData && afterData.customProperties && !beforeData) ||
        (!afterData && beforeData && beforeData.customProperties) ||
        (beforeData && afterData && beforeData.customProperties !== afterData.customProperties)
      ) {
        // Product was added or tags changed, update tagsDoc
        await handleChangedProductCustomProperties(
          afterData as Product,
          beforeData as Product,
          storeCustomPropertiesHelperColl,
          batch
        );
      }
    } catch (error) {
      console.error('Error updating product tags: ', error);
      throw error;
    }

    // let tobaeReved = null;
    const toBeAdded = getDeltaSuggestions(allAdded, allRemoved);
    const toBeRemoved = getDeltaSuggestions(allRemoved, allAdded);
    console.log('to be added suugs: ', toBeAdded);
    console.log('to be removed suugs: ', toBeRemoved);

    if (toBeAdded) {
      await savePrefexSuggestions(toBeAdded, wordSuggestionsObjectsCollection, batch);
  }

  if (toBeRemoved) {
    await deleteWordSuggestions(toBeRemoved, wordSuggestionsObjectsCollection, batch);
}




    // try {
    //   console.info('try handleChangedProductTags')
    //   console.info('afterData: ', afterData)
    //   console.info('beforeData: ', beforeData)
    //   if (
    //     (afterData && afterData.tags && !beforeData) ||
    //     (!afterData && beforeData && beforeData.tags) ||
    //     (beforeData && afterData && beforeData.tags !== afterData.tags)
    //   ) {
    //     // Product was added or tags changed, update tagsDoc
    //     await handleChangedProductTags(
    //       afterData?.tags,
    //       beforeData?.tags,
    //       productTagsHelperDoc,
    //       batch
    //     );
    //   }
    // } catch (error) {
    //   console.error('Error updating product tags: ', error);
    //   throw error;
    // }

    return batch.commit();
  });
  interface Suggestions  {[prefex:string|'zeroWord']:{[suffex:string]:Suggestion}}
async function deleteWordSuggestions(toBeRemoved: Suggestions, wordSuggestionsObjectsCollection: CollectionReference<DocumentData>, batch: FirebaseFirestore.WriteBatch) {
  const prefexes = Object.keys(toBeRemoved);
  // prefexes.forEach(async (prefex) => {
  for (let index = 0; index < prefexes.length; index++) {
    const prefex = prefexes[index];
    const wordDoc = wordSuggestionsObjectsCollection.doc(prefex);
    const wordSnapshot = await wordDoc.get();
    const wordData = wordSnapshot.data();
    const optionsUpdate: { [suffex: string]: Suggestion | FieldValue; } = {};
    const suffexes = Object.keys(toBeRemoved[prefex]);
    suffexes.forEach(suffex => {
      if (wordSnapshot.exists && wordData && wordData[suffex]) {
        if (wordData[suffex].frequency && wordData[suffex].frequency > 2) {
          optionsUpdate[suffex + '.frequency'] = FieldValue.increment(-1);

        } else {
          optionsUpdate[suffex] = FieldValue.delete();
        }
      }
      //  else{
      //   optionsUpdate[suffex] = { suggestion: suffex, frequency: FieldValue.increment(1) } as unknown as Suggestion
      // }
    });

    if (wordSnapshot.exists) {
      batch.update(wordDoc, optionsUpdate);
    }
  }
}

async function savePrefexSuggestions(toBeAdded: Suggestions, wordSuggestionsObjectsCollection: CollectionReference<DocumentData>, batch: FirebaseFirestore.WriteBatch) {
  const prefexes = Object.keys(toBeAdded);
  // prefexes.forEach(async (prefex) => {
  for (let index = 0; index < prefexes.length; index++) {
    const prefex = prefexes[index];
    const wordDoc = wordSuggestionsObjectsCollection.doc(prefex);
    const wordSnapshot = await wordDoc.get();
    const wordData = wordSnapshot.data();
    const optionsUpdate: { [suffex: string]: Suggestion | FieldValue; } = {};
    const suffexes = Object.keys(toBeAdded[prefex]);
    suffexes.forEach(suffex => {
      if (wordSnapshot.exists && wordData && wordData[suffex]) {
        optionsUpdate[suffex + '.frequency'] = FieldValue.increment(1);
        optionsUpdate[suffex + '.lastEditedOn'] = FieldValue.serverTimestamp();
      } else {
        optionsUpdate[suffex] = { suggestion: suffex, lastEditedOn: FieldValue.serverTimestamp() , frequency: FieldValue.increment(1) } as unknown as Suggestion;
      }
    });

    if (wordSnapshot.exists) {
      batch.update(wordDoc, optionsUpdate);
    } else {
      batch.create(wordDoc, optionsUpdate);

    }
  }
}

function getDeltaSuggestions(allAdded: Suggestions | null, allRemoved: Suggestions | null) {
  if (allAdded) {
    let tobeAdded: Suggestions | null = null;
    if (allRemoved) {
      tobeAdded = {};
      const addedKeys = Object.keys(allAdded);
      for (let index = 0; index < addedKeys.length; index++) {
        const prefexWord = addedKeys[index];
        const SuugsObject = allAdded[prefexWord];
        const suggWords = Object.keys(SuugsObject);
        for (let index = 0; index < suggWords.length; index++) {
          const suggWord = suggWords[index];
          if (!allRemoved[prefexWord] || !allRemoved[prefexWord][suggWord]) {
            tobeAdded[prefexWord] = tobeAdded[prefexWord] || {};
            tobeAdded[prefexWord][suggWord] = allAdded[prefexWord][suggWord];
          }
        }

      }
      return tobeAdded;
    } else{
      tobeAdded = allAdded;
      return allAdded;
    }
  }
  return null;
}

  function getSuggestionsForNewName(
    newName: string,
    addedSuggestion: Suggestions ={},
  ):Suggestions {
    newName = newName.trim()
    // Split the name into words, handling multiple spaces
    if (newName) {
    const newWords = newName.trim().split(/\s+/);
    addedSuggestion['zeroWord'] = addedSuggestion['zeroWord'] || {}
    if (addedSuggestion['zeroWord'][newWords[0]]) {
      addedSuggestion['zeroWord'][newWords[0]].frequency++;
    } else {
      addedSuggestion['zeroWord'][newWords[0]] ={suggestion: newWords[0], frequency:1}

    }

    for (let i = 1; i < newWords.length; i++) {
      const nextWord = newWords[i].trim();
      const wordKey = newWords.slice(0, i).join(' ').trim() || 'zeroWord';
      addedSuggestion[wordKey] =  addedSuggestion[wordKey] || {}
      addedSuggestion[wordKey][nextWord]={suggestion:nextWord,frequency:1}
    }
    // console.log(newName, " suggestions: ", addedSuggestion);
    const nextPart = newWords.slice(1).join(' ');
     getSuggestionsForNewName(nextPart, addedSuggestion);

    return addedSuggestion;
  }else{
    return {};
  }

    // const nextPart = newWords.slice(1)
    // if(nextPart && nextPart.length){
    //   await handleSuggestionForNewName(nextPart.join(' '), wordSuggestionsCollection, batch)
    // }
  }

  async function handleSuggestionForNewName(
    newName: string,
    wordSuggestionsCollection: CollectionReference<DocumentData>,
    batch: FirebaseFirestore.WriteBatch
  ) {
    // Split the name into words, handling multiple spaces
    const newWords = newName.trim().split(/\s+/);
    for (let i = 0; i < newWords.length; i++) {
      const nextWord = newWords[i].trim();
      const wordKey = newWords.slice(0, i).join(' ').trim() || 'zeroWord';
  
      const wordDoc = wordSuggestionsCollection.doc(wordKey);
      const wordSnapshot = await wordDoc.get();
  
      if (wordSnapshot.exists) {
        const suggestions = wordSnapshot.data()?.suggestions as Suggestion[];
        const suggestionIndex = suggestions.findIndex(
          (suggestion) => suggestion.suggestion === nextWord
        );
  
        if (suggestionIndex !== -1) {
          suggestions[suggestionIndex].frequency++;
        } else {
          suggestions.push({ suggestion: nextWord, frequency: 1 });
        }
  
        // Sort suggestions based on frequency (descending order)
        suggestions.sort((a, b) => b.frequency - a.frequency);
  
        batch.update(wordDoc, { suggestions });
      } else {
        batch.set(wordDoc, {
          word: wordKey,
          suggestions: [{ suggestion: nextWord, frequency: 1 }],
        });
      }
    }
    
    // const nextPart = newWords.slice(1)
    // if(nextPart && nextPart.length){
    //   await handleSuggestionForNewName(nextPart.join(' '), wordSuggestionsCollection, batch)
    // }
  }
    
async function removeSuggestions(
  name: string,
  wordSuggestionsCollection: CollectionReference<DocumentData>,
  batch: FirebaseFirestore.WriteBatch
) {
  const words = name.trim().split(/\s+/);

  // Handle suggestions for each word in the name
  for (let i = 0; i < words.length; i++) {
    const nextWord = words[i + 1];
    const wordKey = words.slice(0, i).join(' ').trim() || 'zeroWord';

    const wordDoc = wordSuggestionsCollection.doc(wordKey);
    const wordSnapshot = await wordDoc.get();

    if (wordSnapshot.exists) {
      const suggestions = wordSnapshot.data()?.suggestions as Suggestion[];
      const suggestionIndex = suggestions.findIndex(
        (suggestion: Suggestion) => suggestion.suggestion === nextWord
      );

      if (suggestionIndex !== -1) {
        suggestions[suggestionIndex].frequency--;
        if (suggestions[suggestionIndex].frequency === 0) {
          suggestions.splice(suggestionIndex, 1);
        }

        batch.update(wordDoc, { suggestions });
      }
    }
  }

  // const nextPart = words.slice(1)
  // if(nextPart && nextPart.length){
  //   removeSuggestions(nextPart.join(' '), wordSuggestionsCollection, batch)
  // }
}
// async function handleChangedProductTags(
//   newTags: ProductDocTags,
//   oldTags: ProductDocTags,
//   productTagsHelperDoc: FirebaseFirestore.DocumentReference<DocumentData>,
//   batch: FirebaseFirestore.WriteBatch
// ) {
//   // Split the name into words, handling multiple spaces
//   const newTagsArray = tagsObjectToTagsArray(newTags) || [];
//   const oldTagsArray = tagsObjectToTagsArray(oldTags) || [];
//   console.log("newTagsArray: ", newTagsArray, 'oldTagsArray: ', oldTagsArray )
//   if (!isStringArraysEqual(newTagsArray, oldTagsArray)) {
//     let productTagsHelperDocData = (
//       await productTagsHelperDoc.get()
//     ).data() as ProductTagDoc;
//     if (!productTagsHelperDocData || !productTagsHelperDocData.tags) {
//       productTagsHelperDocData = {  tags: {},      id: 'ProductTag'} as ProductTagDoc
//     }
//     for (let index = 0; index < newTagsArray.length; index++) {
//       const tagWord = newTagsArray[index];
//       if (productTagsHelperDocData.tags[tagWord]) {
//         ++productTagsHelperDocData.tags[tagWord].frequency;
//       } else {
//         productTagsHelperDocData.tags[tagWord] = { frequency: 1, tagWord };
//       }
//     }
//     for (let index = 0; index < oldTagsArray.length; index++) {
//       const tagWord = oldTagsArray[index];
//       if (productTagsHelperDocData.tags[tagWord]) {
//         --productTagsHelperDocData.tags[tagWord].frequency;
//         if (productTagsHelperDocData.tags[tagWord].frequency === 0) {
//           delete productTagsHelperDocData.tags[tagWord];
//         }
//       }
      
//     }
//     batch.set(productTagsHelperDoc, productTagsHelperDocData);
//   }

//  }
 async function handleChangedProductCustomProperties(
  newProduct: Product,
  oldProduct: Product,
  storeCustomPropertiesMetaColRef: CollectionReference,
  batch: FirebaseFirestore.WriteBatch
) {
  // Split the name into words, handling multiple spaces
  // const newTagsArray = tagsObjectToTagsArray(newTags) || [];
  // const oldTagsArray = tagsObjectToTagsArray(oldTags) || [];
  const oldCP = oldProduct?.customProperties || {}
  const newCP = newProduct?.customProperties || {}
  // const oldCPKeys = Object.keys(oldCP)
  // const newCPKeys =Object.keys(newCP);
  const addedCP = Object.entries(newCP).filter((entry=> entry[1] && entry[1] !== oldCP[entry[0]]))
   const removedCP = Object.entries(oldCP).filter((entry=>  entry[1] && entry[1] !== newCP[entry[0]]))
console.log('addedCP', addedCP, 'newCP:',newCP, 'oldCP: ', oldCP )
for (let index = 0; index < addedCP.length; index++) {
  const element = addedCP[index];
  const key = element[0];
  const cpRef = storeCustomPropertiesMetaColRef.doc(key);

  const fieldKey =  'options.' + element[1] as string + '.freq' 
  const optionsUpdate : {[a:string]:any } = { }
  optionsUpdate[fieldKey] = FieldValue.increment(1)
  optionsUpdate['options.' + element[1] as string + '.lastEditedOn'] = FieldValue.serverTimestamp();
  const docSnap = await cpRef.get();

if (docSnap.exists) {
  batch.update(cpRef,optionsUpdate)
} else {
  // docSnap.data() will be undefined in this case
  batch.create(cpRef,{options:{}})

  batch.update(cpRef,optionsUpdate)
}
  // cpRef.update(new FieldPath(key,element[1] as string ),'',[])
} 
 for (let index = 0; index < removedCP.length; index++) {
  const element = removedCP[index];
  const key = element[0];
  const cpRef = storeCustomPropertiesMetaColRef.doc(key);
  const fieldKey =  'options.' + element[1] as string + '.freq' 
  const optionsUpdate : {[a:string]:any } = { }
  optionsUpdate[fieldKey] = FieldValue.increment(-1)
  batch.update(cpRef,optionsUpdate,)
  // cpRef.update(new FieldPath(key,element[1] as string ),'',[])
}

  

 }
