/* eslint-disable */
// See this, ha! ~ https://github.com/facebook/create-react-app/issues/8014

import { ts } from "ts-morph";

/** ===========================================================================
 * TSX Syntax Highlighting Worker
 * ----------------------------------------------------------------------------
 * Reference:
 * - https://blog.expo.io/building-a-code-editor-with-monaco-f84b3a06deaf
 * - https://github.com/codesandbox/codesandbox-client/blob/master/packages/app/src/embed/components/Content/Monaco/workers/fetch-dependency-typings.js
 * - https://github.com/cancerberoSgx/jsx-alone/blob/master/jsx-explorer/HOWTO_JSX_MONACO.md
 *
 * TODO:
 * - Improve types in this file
 * - Improve types for shared messages which are passed between this worker
 *   and the Workspace which uses it.
 * ============================================================================
 */

function getLineNumberAndOffset(start: any, lines: any) {
  let line = 0;
  let offset = 0;
  while (offset + +lines[line] < start) {
    offset += +lines[line] + 1;
    line += 1;
  }

  return { line: line + 1, offset };
}

function nodeToRange(node: any) {
  if (
    typeof node.getStart === "function" &&
    typeof node.getEnd === "function"
  ) {
    return [node.getStart(), node.getEnd()];
  } else if (
    typeof node.pos !== "undefined" &&
    typeof node.end !== "undefined"
  ) {
    return [node.pos, node.end];
  }
  return [0, 0];
}

function getNodeType(parent: any, node: any) {
  return Object.keys(parent).find(key => parent[key] === node);
}

function getParentRanges(node: any) {
  // tslint:disable-next-line
  const ranges: Array<any> = [];
  const [start, end] = nodeToRange(node);
  let lastEnd = start;

  ts.forEachChild(node, child => {
    const [nodeStart, nodeEnd] = nodeToRange(child);

    ranges.push({
      start: lastEnd,
      end: nodeStart,
    });
    lastEnd = nodeEnd;
  });

  if (lastEnd !== end) {
    ranges.push({
      start: lastEnd,
      end,
    });
  }

  return ranges;
}

function addChildNodes(node: any, lines: any, classifications: any) {
  const parentKind = ts.SyntaxKind[node.kind];

  ts.forEachChild(node, id => {
    const type = getNodeType(node, id);

    classifications.push(
      ...getParentRanges(id).map(innerNode => {
        const { start, end } = innerNode;
        const { offset, line: startLine } = getLineNumberAndOffset(
          start,
          lines,
        );
        const { line: endLine } = getLineNumberAndOffset(end, lines);

        return {
          start: +start + 1 - offset,
          end: +end + 1 - offset,
          kind: ts.SyntaxKind[id.kind],
          parentKind,
          type,
          startLine,
          endLine,
        };
      }),
    );

    addChildNodes(id, lines, classifications);
  });
}

// Respond to message from parent thread
self.addEventListener("message", event => {
  const { code } = event.data;
  try {
    const classifications: ReadonlyArray<any> = [];
    const sourceFile = ts.createSourceFile(
      "workspace.tsx" /* Arbitrary */,
      code,
      ts.ScriptTarget.ES2017,
      true,
      4,
    );

    const lines = code.split("\n").map((line: any) => line.length);
    addChildNodes(sourceFile, lines, classifications);

    const identifier = "TSX_SYNTAX_HIGHLIGHTER";

    // @ts-ignore
    self.postMessage({ classifications, identifier });
  } catch (error) {
    console.log("Error from syntax highlighter worker! ", error);
  }
});
