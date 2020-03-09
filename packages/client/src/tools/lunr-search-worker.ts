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
  SearchResultMatch,
} from "modules/challenges/types";
import stripMarkdown from "remove-markdown";
import pipe from "ramda/es/pipe";

// Rudimentary. The markdown we store automatically from Codepress includes some
// escape sequences that we don't want to or need to search over.
// Ex: "\(this is what you have to implement\!\)" should not have escape "\" in it
const stripEscapeChars = (x: string): string => {
  return x.replace(/\\([!@#$%^&*()])/g, "$1");
};

const toPlainText = pipe((x: string) => stripMarkdown(x), stripEscapeChars);

// The Lunr search index
let idx: lunr.Index | null = null;

// A mapping of identifiers (refs) to full documents. This is used to construct
// excerpts from lunr search results
const documentLookup: { [k: string]: SearchDocument } = {};

// Given a Course build out a flat list of SearchDocuments based on the challenges
const buildSearchDocuments = (course: Course): SearchDocument[] => {
  const documents = course.modules
    .flatMap(x => x.challenges)
    .map(x => ({
      id: x.id,
      title: toPlainText(x.title),
      instructions: toPlainText(x.instructions),
      content: toPlainText(x.content),
    }));

  return documents;
};

// NOTE: This is not exactly just any string but a "stemmed" search terms. So
// "coding library" might turn into "code" and "library" when searched. Note
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

interface ILocation {
  position: Array<[number, number]>;
}

const buildResultMatch = (
  fieldName: keyof SearchDocument, // Which field the match was found in
  location: ILocation, // What position in the content it was found at
  content: string, // The full value of the content in which it was found
): SearchResultMatch => {
  // Not yet sure why position is an array of arrays
  const [[from, charCount]] = location.position;

  // The rough number of characters to include on either side of the match. The
  // before padding is shorter so that the match will appear more towards the
  // right in the excerpt
  const matchPaddingBefore = 30;
  const matchPaddingAfter = 100;

  // Build up an excerpt that browser can show the user.
  //
  // Start the excerpt either at
  // - 0 (if the matching term was found near the start of the content)
  // - Right after the first space found starting at the offset (to avoid partial words)
  const excerptStart =
    from - matchPaddingBefore > 0
      ? content.indexOf(" ", from - matchPaddingBefore) + 1
      : 0;
  const beforeMatch =
    (excerptStart > 0 ? "..." : "") + content.slice(excerptStart, from);

  // The matched text itself
  const match = content.slice(from, from + charCount);

  // The excerpt end. Tries to avoid going over the length of the content
  const afterMatch = content.slice(
    from + charCount,
    Math.min(
      content.indexOf(".", from) + 1, // Cut up to the next period or... (+1 to include the period)
      from + matchPaddingAfter, // ... N characters if not found or...
      content.length, // ... the length of the document, if that is less than the others
    ),
  );

  return {
    foundIn: fieldName,
    matchContext: {
      beforeMatch,
      match,
      afterMatch,
    },
  };
};

// Given a lurn.Index.Result give back something a bit more useful to the UI
const buildSearchResult = (result: ISearchResult): SearchResult => {
  const doc = documentLookup[result.ref];
  const metadata = result.matchData.metadata;
  const matches: SearchResultMatch[] = Object.keys(metadata).flatMap(term => {
    const matchLocationsByFields = metadata[term];
    const reducer = (
      agg: SearchResultMatch[],
      documentFieldName: keyof typeof matchLocationsByFields,
    ) => {
      const matchLocation = matchLocationsByFields[documentFieldName];
      const content = doc[documentFieldName];
      const resultMatch = buildResultMatch(
        documentFieldName,
        matchLocation,
        content,
      );
      return [...agg, resultMatch];
    };

    // NOTE: Object.keys is the problem with the typing here. Even though all
    // keys of matchLocations are known it's still inferred as string[] and as
    // far as I can tell there is know way to override this assumption. The
    // explicit typing on _result will give us some type support though
    const resultMatches: SearchResultMatch[] = Object.keys(
      matchLocationsByFields,
    )
      // @ts-ignore
      .reduce(reducer, []);

    return resultMatches;
  });

  return {
    id: doc.id,
    title: doc.title,
    score: result.score,
    matches,
  };
};

// Create the indexer function that Lunr will use to build the search index
const createIndexer = (documents: SearchDocument[]) => {
  // NOTE: We need to access `this` in Lunr so we cannot use arrow funks here.
  // Unfortunate API :/
  return function buildLunarIndex(this: lunr.Builder) {
    // This is the identifier field. It's value for each result will be placed in
    // the `ref` prop of each result object
    const identifier: keyof SearchDocument = "id";
    const searchFields: Array<keyof SearchDocument> = [
      "title",
      "instructions",
      "content",
    ];

    // Set the ID field
    this.ref(identifier);

    // Set the search fields
    searchFields.forEach(fieldName => {
      this.field(fieldName);
    });

    // Allow the positions of matching terms in the metadata. This is disabled by
    // default to reduce index size
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
