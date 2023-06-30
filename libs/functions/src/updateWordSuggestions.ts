import {
  ProductDocTags,
  ProductTagDoc,
  isStringArraysEqual,
  tagsObjectToTagsArray,
} from '../../app-models/src/index';
import * as functions from 'firebase-functions';
import {
  CollectionReference,
  DocumentData,
  getFirestore,
} from 'firebase-admin/firestore';

const firestore = getFirestore();

interface Suggestion {
  suggestion: string;
  frequency: number;
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
    const productTagsHelperDoc = firestore.doc(
      `/stores/${storeId}/galleries/${galleryId}/gallaryHelperDocs/productTags`
    );
    const batch = firestore.batch();
    console.info('try handle name suggestions')


    try {
      if (
        (afterData && !beforeData) ||
        (beforeData && afterData && beforeData.name !== afterData.name)
      ) {
        // Product was added or name changed, update suggestions
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
      console.info('try handleChangedProductTags')
      console.info('afterData: ', afterData)
      console.info('beforeData: ', beforeData)
      if (
        (afterData && afterData.tags && !beforeData) ||
        (!afterData && beforeData && beforeData.tags) ||
        (beforeData && afterData && beforeData.tags !== afterData.tags)
      ) {
        // Product was added or tags changed, update tagsDoc
        await handleChangedProductTags(
          afterData?.tags,
          beforeData?.tags,
          productTagsHelperDoc,
          batch
        );
      }
    } catch (error) {
      console.error('Error updating product tags: ', error);
      throw error;
    }

    return batch.commit();
  });

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
}
async function handleChangedProductTags(
  newTags: ProductDocTags,
  oldTags: ProductDocTags,
  productTagsHelperDoc: FirebaseFirestore.DocumentReference<DocumentData>,
  batch: FirebaseFirestore.WriteBatch
) {
  // Split the name into words, handling multiple spaces
  const newTagsArray = tagsObjectToTagsArray(newTags) || [];
  const oldTagsArray = tagsObjectToTagsArray(oldTags) || [];
  console.log("newTagsArray: ", newTagsArray, 'oldTagsArray: ', oldTagsArray )
  if (!isStringArraysEqual(newTagsArray, oldTagsArray)) {
    let productTagsHelperDocData = (
      await productTagsHelperDoc.get()
    ).data() as ProductTagDoc;
    if (!productTagsHelperDocData || !productTagsHelperDocData.tags) {
      productTagsHelperDocData = {  tags: {},      id: 'ProductTag'} as ProductTagDoc
    }
    for (let index = 0; index < newTagsArray.length; index++) {
      const tagWord = newTagsArray[index];
      if (productTagsHelperDocData.tags[tagWord]) {
        ++productTagsHelperDocData.tags[tagWord].frequency;
      } else {
        productTagsHelperDocData.tags[tagWord] = { frequency: 1, tagWord };
      }
    }
    for (let index = 0; index < oldTagsArray.length; index++) {
      const tagWord = oldTagsArray[index];
      if (productTagsHelperDocData.tags[tagWord]) {
        --productTagsHelperDocData.tags[tagWord].frequency;
        if (productTagsHelperDocData.tags[tagWord].frequency === 0) {
          delete productTagsHelperDocData.tags[tagWord];
        }
      }
      
    }
    batch.set(productTagsHelperDoc, productTagsHelperDocData);
  }

 }
