/* eslint-disable */
// See this, ha! ~ https://github.com/facebook/create-react-app/issues/8014

import lunr from "lunr";
import { Course } from "@pairwise/common";
import {
  SEARCH,
  SEARCH_SUCCESS,
  BUILD_SEARCH_INDEX_FAILURE,
  BUILD_SEARCH_INDEX,
  BUILD_SEARCH_INDEX_SUCCESS,
} from "./constants";
import { SearchDocument, SearchMessageEvent } from "modules/challenges/types";

// The Lunr search index
let idx: lunr.Index | null = null;

// A mapping of identifiers (refs) to full documents. This is used to construct
// excerpts from lunr search results
const documentLookup: { [k: string]: SearchDocument } = {};

// Given a Course buld out a flat list of SearchDocuments based on the challenges
const buildSearchDocuments = (course: Course): SearchDocument[] => {
  const documents = course.modules
    .map(x => x.challenges)
    .reduce((arr, x) => arr.concat(x)) // Flatten
    .map(x => ({
      id: x.id,
      title: x.title,
      content: x.content,
      supplementaryContent: x.supplementaryContent,
    }));

  return documents;
};

const buildSearchResults = (xs: lunr.Index.Result) => {
  return xs; // TODO
};

// Create the indexer function that Lunr will use to build the search index
const createIndexer = (documents: SearchDocument[]) => {
  // NOTE: We need to access `this` in Lunr so we cannot use arrow funcs here.
  // Unfortunate API :/
  return function buildLunarIndex(this: lunr.Builder) {
    // This is the identifier field. It's value for each result will be placed in
    // the `ref` prop of each result object
    this.ref("id");

    // I'm guessin you can search multiple fields, thus this
    this.field("ttile");
    this.field("content");
    this.field("supplementaryContent");

    // Allow the positions of matching terms in the metadata. This is disabled by
    // dfeault to reduce index size
    this.metadataWhitelist = ["position"];

    // Very important. Add all the documents to the index
    documents.forEach(x => {
      this.add(x);
    });
  };
};

self.addEventListener("message", (event: SearchMessageEvent) => {
  const { type, payload } = event.data;
  switch (type) {
    case SEARCH: {
      if (!idx) {
        console.warn("[WARN]: Search sent before index was built");
        return;
      }

      // NOTE: Search success does not guarantee any results. May well be an
      // empty array
      const results = idx.search(payload as string).map(buildSearchResults);

      // @ts-ignore
      self.postMessage({ type: SEARCH_SUCCESS, payload: results });
      break;
    }
    case BUILD_SEARCH_INDEX: {
      try {
        const documents = buildSearchDocuments(payload as Course);
        const indexer = createIndexer(documents);

        // Add all the documents to the lookup for use in constructing excerpts
        documents.forEach(x => {
          documentLookup[x.id] = x;
        });

        // Build the index
        idx = lunr(indexer);

        // @ts-ignore
        self.postMessage({ type: BUILD_SEARCH_INDEX_SUCCESS });
      } catch (err) {
        // Not sure why this would happen but handling it anyway.
        console.error("[ERR]: Could not build search index", err);
        // @ts-ignore
        self.postMessage({ type: BUILD_SEARCH_INDEX_FAILURE });
      }
      break;
    }
    default:
      console.warn(
        `[WARN]: Search worker passed an unknown message type "${type}"`,
      );
      break;
  }
});

// const results = idx.search(process.argv[2]).map(result => {
//   const doc = documentLookup[result.ref];
//   const metadata = result.matchData.metadata;
//   const matches = Object.keys(metadata).map(term => {
//     const matchLocations = metadata[term];
//     const locations = Object.keys(matchLocations).map(locationName => {
//       const location = metadata[term][locationName];
//       const content = doc[locationName];

//       // Not yet sure why postion is an array of arrays
//       const [[from, charCount]] = location.position;

//       // The excerpt string leading up to the match.
//       // NOTE: term here is the "stemmed" term that lunr has come up with so it
//       // is not guaranteed to be the user entered search string. We could
//       // instead match against the user entered search string, or even do some
//       // sort of highlighting of both... although that would quickly become
//       // complex.
//       const before = content.slice(from - 30, from);
//       const highlighted =
//         "--------" + content.slice(from, from + term.length) + "--------";
//       const after = content.slice(
//         from + term.length,

//         Math.min(
//           doc[locationName].indexOf(".", from) + 1, // Cut up to the next period or... (+1 to include the period)
//           from + 50, // ... N characters if not found or...
//           doc[locationName].length, // ... the length of the document, if that is less than the others
//         ),
//       );

//       const matchExcerpt = before + highlighted + after;

//       return {
//         foundIn: locationName,
//         position: location.position,
//         matchExcerpt,
//       };
//     });
//     return locations;
//   });

//   return {
//     title: doc.title,
//     matches,
//     ...result,
//   };
// });
