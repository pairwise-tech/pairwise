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
import {
  SearchDocument,
  SearchMessageEvent,
  SearchResult,
} from "modules/challenges/types";

// The Lunr search index
let idx: lunr.Index | null = null;

// A mapping of identifiers (refs) to full documents. This is used to construct
// excerpts from lunr search results
const documentLookup: { [k: string]: SearchDocument } = {};

// Given a Course build out a flat list of SearchDocuments based on the challenges
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

// NOTE: This is not exactly just any string but a "stemmed" search terms. So
// "coding library" might turn into "code" and "library" when saerched. Note
// that "code" is semantically the same as "coding" but not literally.
interface IMatchData extends lunr.MatchData {
  metadata: {
    [k: string]: {
      // See NOTE
      [k in keyof SearchDocument]: {
        position: Array<[number, number]>;
      };
    };
  };
}

interface ISearchResult extends lunr.Index.Result {
  matchData: IMatchData;
}

// Given a lurn.Index.Result give back something a bit more useful to the UI
const buildSearchResult = (result: ISearchResult): SearchResult => {
  const doc = documentLookup[result.ref];
  const metadata = result.matchData.metadata;
  const matches = Object.keys(metadata).map(term => {
    const matchLocations = metadata[term];

    return Object.keys(matchLocations).reduce(
      // Object.keys(...) is insisting the return value is string and thus
      // locationName cannot be a keyof SearchDocument. Or if locationName is
      // string then code further down fails because string cannot index some of
      // these types, it wants specific literals.
      // @ts-ignore
      (agg, locationName: keyof SearchDocument) => {
        const location = metadata[term][locationName];
        const content = doc[locationName];

        // Not yet sure why postion is an array of arrays
        const [[from, charCount]] = location.position;
        const matchPadding = 50; // Number of characters on either side to try to pad the match context with

        // The excerpt string leading up to the match.
        // NOTE: term here is the "stemmed" term that lunr has come up with so it
        // is not guaranteed to be the user entered search string. We could
        // instead match against the user entered search string, or even do some
        // sort of highlighting of both... although that would quickly become
        // complex.
        const beforeMatch = content.slice(from - matchPadding, from);
        const match = content.slice(from, from + term.length);
        const afterMatch = content.slice(
          from + term.length,
          Math.min(
            content.indexOf(".", from) + 1, // Cut up to the next period or... (+1 to include the period)
            from + matchPadding, // ... N characters if not found or...
            content.length, // ... the length of the document, if that is less than the others
          ),
        );

        return {
          foundIn: locationName,
          matchContext: {
            beforeMatch,
            match,
            afterMatch,
          },
        };
      },
      [],
    );
  });

  return {
    id: doc.id,
    title: doc.title,
    matches,
  };
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
      // NOTE: I was between a rock and a hard place with the typing on this
      // stuff. The fact of the matter is the metadata prop can is just a
      // mapping of strings to ... pretty much anything depending on what lunr
      // plugins you use. We're using the standard setup so you get LUNR-STEMMED
      // SEARCH TERMS mapping to fields on the data we provided to be searched
      // over. I.e. the data in the index. So those fields will be fields on
      // SearchDocument. The alternative I was finding was using quite a few
      // anys in places. So yes, this filer function does not actually guarantee
      // anything but it does allow this file to typecheck
      const results = idx
        .search(payload as string)
        .filter((x): x is ISearchResult => true) // See NOTE
        .map(buildSearchResult);

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
