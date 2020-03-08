import React from "react";
import { EditorProps, SlatePlugin } from "rich-markdown-editor";
import { withRouter, RouteComponentProps } from "react-router-dom";
import toaster from "tools/toast-utils";
import { ContentUtility } from "@pairwise/common";
import styled from "styled-components/macro";
import { COLORS, SANDBOX_ID } from "tools/constants";
import Modules, { ReduxStoreState } from "modules/root";
import { connect } from "react-redux";
import { timer } from "rxjs";
import { map } from "rxjs/operators";
import { Editor } from "slate-react";
import { Leaf } from "slate";

const RichMarkdownEditor = React.lazy(() => import("rich-markdown-editor"));

// All adapted from the markdown shorcuts that ship with the lib by default:
// https://github.com/outline/rich-markdown-editor/blob/master/src/plugins/MarkdownShortcuts.js
const MarkdownShortcuts = (): SlatePlugin => {
  const inlineShortcuts = [
    { mark: "bold", shortcut: "**" },
    { mark: "italic", shortcut: "_" },
    { mark: "code", shortcut: "`" },
  ];

  const keydownWhitelist = new Set(inlineShortcuts.map(x => x.shortcut[0]));

  const onSpecialChar = (
    e: React.KeyboardEvent,
    editor: Editor,
    next: () => void,
  ) => {
    const { value } = editor;
    const { selection, startBlock } = value;
    const firstText = startBlock.getFirstText();
    if (selection.isExpanded || !firstText) {
      console.warn("[WARN] Skipping because selection is expanded");
      return next();
    }

    // NOTE: There's some oddness with scope going on here. The logic in here
    // _does not work_ if using a forEach loop with callback
    for (const { mark, shortcut } of inlineShortcuts) {
      const inlineTags = [];
      const fullText = startBlock.text;
      // By using this text of the last leaf we avoid the issue of having a
      // previous char complete this string. For example, given the string
      // "italic uses `_` to make things _italic_" we want the first underscore
      // to be in a code tag and the word "italic" to be italicized. We do not
      // want the first underscore of "_italic_" to close out the previous on in
      // backticks
      // @ts-ignore Slate React typings are poorly versioned
      const text = firstText.getLeaves().last().text;
      const leadingText = firstText
        // @ts-ignore Slate React typings are poorly versioned
        .getLeaves()
        .slice(0, -1)
        .map((x: Leaf | undefined) => x?.get("text") || "")
        .reduce((agg: string, x: string = "") => agg + x, "");
      const offsetFromStart = leadingText !== text ? leadingText.length : 0;
      const potentialText = text + e.key; // This is a keydown handler, so this is the text that would be on the page _after_ thepress

      // only add tags if they have spaces around them or the tag is beginning
      // or the end of the block
      for (let i = 0; i < potentialText.length; i++) {
        const start = i;
        const end = i + shortcut.length;
        const beginningOfBlock = start === 0;
        const endOfBlock = end === potentialText.length;
        const surroundedByWhitespaces = [
          potentialText.slice(start - 1, start),
          potentialText.slice(end, end + 1),
        ].includes(" ");
        const markStart = offsetFromStart + i;
        const markEnd = offsetFromStart + text.length - shortcut.length;
        const markInner = fullText.slice(markStart, markEnd);

        if (
          potentialText.slice(start, end) === shortcut &&
          (beginningOfBlock || endOfBlock || surroundedByWhitespaces) &&
          markInner !== "`" // Special case to prevent ``` from turning into an inline code mark (because it should become a code block)
        ) {
          inlineTags.push(markStart); // Start of inline tag
        }
      }

      const [firstCodeTagIndex, lastCodeTagIndex] = inlineTags;
      const markLength = lastCodeTagIndex - firstCodeTagIndex;
      if (inlineTags.length > 1 && markLength > 1) {
        // Prevent the key that closed this out from getting inserted
        if (!e.defaultPrevented) {
          e.preventDefault();
        }

        return editor
          .removeTextByKey(firstText.key, lastCodeTagIndex, shortcut.length)
          .removeTextByKey(firstText.key, firstCodeTagIndex, shortcut.length)
          .moveAnchorTo(firstCodeTagIndex, lastCodeTagIndex)
          .addMark(mark)
          .moveToEnd()
          .removeMark(mark);
      }
    }

    return next();
  };
  /**
   * Get the block type for a series of auto-markdown shortcut `chars`.
   */
  function getType(chars: string) {
    switch (chars) {
      case "*":
      case "-":
      case "+":
      case "1.":
      case "[ ]":
      case "[x]":
        return "list-item";
      case ">":
        return "block-quote";
      case "#":
        return "heading1";
      case "##":
        return "heading2";
      case "###":
        return "heading3";
      case "####":
        return "heading4";
      case "#####":
        return "heading5";
      case "######":
        return "heading6";
      default:
        return null;
    }
  }
  /**
   * On space, if it was after an auto-markdown shortcut, convert the current
   * node into the shortcut's corresponding type.
   */
  const onSpace = (
    ev: React.KeyboardEvent,
    editor: Editor,
    next: () => void,
  ) => {
    const { value } = editor;
    const { selection, startBlock } = value;
    if (selection.isExpanded) {
      return next();
    }

    const chars = startBlock.text.slice(0, selection.start.offset).trim();
    const type = getType(chars);

    // @ts-ignore Slate React types depend on the wrong version of @types/slate...
    if (type && !editor.isSelectionInTable()) {
      // only shortcuts to change heading size should work in headings
      if (startBlock.type.match(/heading/) && !type.match(/heading/)) {
        return next();
      }
      // don't allow doubling up a list item
      if (type === "list-item" && startBlock.type === "list-item") {
        return next();
      }

      // Prevent the space from being inserted
      ev.preventDefault();

      let checked = false;
      if (chars === "[x]") {
        checked = true;
      }
      if (chars === "[ ]") {
        checked = false;
      }

      // @ts-ignore Slate React types depend on the wrong version of @types/slate...
      editor.withoutNormalizing(c => {
        c.moveFocusToStartOfNode(startBlock)
          .delete()
          .setBlocks({
            type,
            data: { checked },
          });

        if (type === "list-item") {
          if (checked !== undefined) {
            return c.wrapBlock("todo-list");
          } else if (chars === "1.") {
            return c.wrapBlock("ordered-list");
          } else {
            return c.wrapBlock("bulleted-list");
          }
        }
      });
    }

    // Purposefully not pasing to next here so that the rich-markdown-editor
    // default handler does not fire. That handler is where the error-prone
    // parsing of inline markdown was happening.
    return;
  };

  const onKeyDown = (
    e: React.KeyboardEvent,
    editor: Editor,
    next: () => void,
  ) => {
    const { value } = editor;
    const { startBlock } = value;

    if (!startBlock) {
      return next();
    }

    // markdown shortcuts should not be parsed in code
    if (startBlock.type.match(/code/)) {
      return next();
    }

    if (e.key === " ") {
      return onSpace(e, editor, next);
    } else if (keydownWhitelist.has(e.key)) {
      return onSpecialChar(e, editor, next);
    } else {
      return next();
    }
  };

  return { onKeyDown };
};

const markdownShortcuts = MarkdownShortcuts();

/** ===========================================================================
 * ContentEditor
 * ----------------------------------------------------------------------------
 * The ContentEditor is our rich markdown editor for use in codepress for
 * editing and in the overall app for viewing markdown content.
 *
 * This export attaches the theme and any other props that are unlikely to
 * change if the editor is used in different places.
 *
 * @NOTE Render this within <Suspense />. React will throw a helpful error if not
 * @NOTE Currently this has to be a class component if we want getSearchLinks to
 * work... because of the way the underlying editor component requires a promise
 * with results to come back we need a reference to this in order to get the
 * latest search results. Without this reference we use `props` but it will get
 * scoped in and stale.
 * ============================================================================
 */
class ContentEditor extends React.Component<Props> {
  getSearchLinks = (searchTerm: string) => {
    // Kick off a search request...
    this.props.requestSearchResults(searchTerm);

    // An arbitrary amount of time later just pass the search results in
    return timer(600)
      .pipe(
        map(() => {
          return this.props.searchResults.map(x => ({
            title: x.title,
            url: `/workspace/${x.id}`,
          }));
        }),
      )
      .toPromise();
  };

  render() {
    const { history, plugins = [], ...props } = this.props;
    return (
      <EditorExternalStyles>
        <RichMarkdownEditor
          plugins={[...plugins, markdownShortcuts]}
          theme={editorTheme}
          onSearchLink={this.getSearchLinks}
          onShowToast={message => {
            toaster.toast.show({
              message,
            });
          }}
          onClickLink={href => {
            const scrollTarget = getScrollTarget(href);

            if (scrollTarget) {
              const el = document.getElementById(scrollTarget);
              el?.scrollIntoView({
                behavior: "smooth",
              });
            } else if (isInternalLink(href)) {
              history.push(href);
            } else {
              window.open(href, "_blank");
            }
          }}
          {...props}
        />
      </EditorExternalStyles>
    );
  }
}

/**
 * Helper function to determine if onClickLink's href is custom scroll target.
 * If so, override default behavior and smooth scroll to target. In editor,
 * you must set the link's href to: `/scrollTarget/<id-to-scroll-to>`
 */
const getScrollTarget = (href: string) => {
  const re = /^\/scrollTarget\/([\w-]+)$/;
  const match = href.match(re);

  if (match) {
    return match[1];
  }
};

/**
 * Helper function to determine if onClickLink's href is Pairwise internal
 * link. If so, override default behavior and use RR to navigate to route.
 * In editor, set the link's href to: `/<route>`, e.g. `/workspace/IEC6FcKI`
 */
const isInternalLink = (href: string) => {
  // rich-markdown-editor adds 'https://' to the beginning of any href
  // that does not start with a forward slash, so just test that href
  // is a route and not a fully qualified URL
  if (!href.startsWith("http")) {
    const re = /^\/workspace\/(\w*)$/;
    const isChallengeRoute = href.match(re);

    if (isChallengeRoute) {
      const challengeId = isChallengeRoute[1];
      // throw error if we provide an invalid id in workspace route
      // so that this does not get past us during development
      if (
        !ContentUtility.challengeIdIsValid(challengeId) &&
        challengeId !== SANDBOX_ID
      ) {
        throw new Error("[Err ContentEditor] Invalid Challenge Link.");
      }
    }

    return true;
  }

  return false;
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

// Adapted from: https://github.com/outline/rich-markdown-editor/blob/master/src/theme.js
export const editorColors = {
  almostBlack: "#181A1B",
  lightBlack: "#2F3336",
  almostWhite: "#E6E6E6",
  white: "#FFF",
  white10: "rgba(255, 255, 255, 0.1)",
  black: "#000",
  black10: "rgba(0, 0, 0, 0.1)",
  primary: "#1AB6FF",
  greyLight: "#F4F7FA",
  grey: "#E8EBED",
  greyMid: "#9BA6B2",
  greyDark: "#DAE1E9",
  codeString: "#032f62",
};

const editorTheme = {
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen, Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif",
  fontFamilyMono:
    "'SFMono-Regular',Consolas,'Liberation Mono', Menlo, Courier,monospace",
  fontWeight: 400,
  zIndex: 100,
  link: editorColors.primary,
  placeholder: "#B1BECC",
  textSecondary: "#4E5C6E",
  textLight: editorColors.white,
  selected: editorColors.primary,
  codeComment: "#6a737d",
  codePunctuation: "#5e6687",
  codeNumber: "#d73a49",
  codeProperty: "#c08b30",
  codeTag: "#3d8fd1",
  codeSelector: "#6679cc",
  codeAttr: "#c76b29",
  codeEntity: "#22a2c9",
  codeKeyword: "#d73a49",
  codeFunction: "#6f42c1",
  codeStatement: "#22a2c9",
  codePlaceholder: "#3d8fd1",
  codeInserted: "#202746",
  codeImportant: "#c94922",

  background: "transparent",
  text: editorColors.almostWhite,
  code: editorColors.almostWhite,

  toolbarBackground: "#3a3a3a",
  toolbarInput: editorColors.white10,
  toolbarItem: editorColors.almostWhite,

  blockToolbarBackground: editorColors.white,
  blockToolbarTrigger: editorColors.almostWhite,
  blockToolbarTriggerIcon: editorColors.almostBlack,
  blockToolbarItem: editorColors.lightBlack,

  tableDivider: editorColors.lightBlack,
  tableSelected: editorColors.primary,
  tableSelectedBackground: "#002333",

  quote: editorColors.almostWhite,
  codeBackground: editorColors.almostBlack,
  codeBorder: editorColors.lightBlack,
  codeString: editorColors.codeString,
  horizontalRule: editorColors.lightBlack,
  imageErrorBackground: "rgba(0, 0, 0, 0.5)",
  hiddenToolbarButtons: {
    blocks: ["code"],
  },
};

/**
 * The theme property of the markdown editor doesn't provide control over all
 * styles unfortunately, so some elements need to be styled externally.
 */
const EditorExternalStyles = styled.div`
  font-size: 17px;
  position: relative;

  blockquote {
    margin-left: 10px !important;
    background: ${COLORS.LIGHT_GREY} !important;
    font-style: normal !important;
    border-left-width: 9px !important;
    padding: 5px 20px 5px 10px !important;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.1;
  }

  ul,
  ol {
    margin-left: 30px !important;
  }

  // Inline code
  p code {
    color: rgb(108, 188, 255);
  }

  .prism-token.token {
    color: white;

    &.function {
      color: #dcdcaa;
    }
    &.keyword {
      color: rgb(86, 156, 214);
    }
    &.string,
    &.tag.attr-value {
      color: rgb(214, 157, 133);
    }
    &.builtin {
      color: rgb(78, 201, 176);
    }
    &.tag.attr-name {
      color: rgb(156, 220, 254);
    }
    &.punctuation {
      color: ${editorColors.almostWhite};
    }
    &.operator {
      color: ${editorColors.almostWhite};
    }
    &.parameter {
      color: ${editorColors.almostWhite};
    }
  }
`;

/** ===========================================================================
 * Export
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  searchResults: Modules.selectors.challenges.getSearchResults(state),
});

const dispatchProps = {
  requestSearchResults: Modules.actions.challenges.requestSearchResults,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type Props = RouteComponentProps & ConnectProps & EditorProps;

export default withRouter(
  connect(mapStateToProps, dispatchProps)(ContentEditor),
);
