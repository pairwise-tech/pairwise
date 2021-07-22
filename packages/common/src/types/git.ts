/** ===========================================================================
 * Types for challenge metadata which is constructed from git history.
 * ============================================================================
 */

export interface ChallengeMetadata {
  filename: string;
  keypath: Array<string | number>;
  course: {
    id: string;
    title: string;
    description: string;
    free: boolean;
    price: number;
  };
  module: {
    id: string;
    title: string;
    free: boolean;
  };
  challenge: {
    id: string;
    type: string;
    title: string;
  };
  gitMetadata: {
    lineRange: number[];
    contributors: string[];
    contributionsBy: { [k: string]: string[] };
    edits: number;
    earliestUpdate: {
      commit: string;
      summary: string;
      author: string;
      authorDate: string;
    };
    latestUpdate: {
      commit: string;
      summary: string;
      author: string;
      authorDate: string;
    };
  };
}

interface PairwiseStats {
  buildCommit: string;
  totalChallenges: number;
  codeChallenges: number;
  videoChallenges: number;
  todoChallenges: string[];
}

export interface ChallengeMetadataIndex {
  "@@PAIRWISE": PairwiseStats;
  challenges: { [k: string]: ChallengeMetadata };
}
