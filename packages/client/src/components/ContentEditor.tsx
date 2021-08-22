import React from "react";
import { EditorProps, SlatePlugin } from "rich-markdown-editor";
import { withRouter, RouteComponentProps } from "react-router-dom";
import toaster from "tools/toast-utils";
import styled from "styled-components/macro";
import { COLORS, SANDBOX_ID } from "tools/constants";
import Modules, { ReduxStoreState } from "modules/root";
import { connect } from "react-redux";
import { lastValueFrom, timer } from "rxjs";
import { map } from "rxjs/operators";
import { Editor } from "slate-react";
import { Leaf, Selection, Block, Mark } from "slate";
import { List } from "immutable";
import { CODEPRESS_HOST } from "tools/client-env";
import pipe from "ramda/es/pipe";
import tryCatch from "ramda/es/tryCatch";
import { Dictionary } from "ramda";
import { scrollToVideoAndPlay, scrollToContentArea } from "./MediaArea";
import { Button } from "@blueprintjs/core";
import { AppTheme, InverseChallengeMapping } from "@pairwise/common";
import { themeColor, themeText } from "./ThemeContainer";

const RichMarkdownEditor = React.lazy(() => import("rich-markdown-editor"));

const uploadFile = (
  file: File,
  resourceId: Nullable<string>,
): Promise<string> => {
  if (!resourceId) {
    return Promise.reject(new Error("No challenge ID provided for upload"));
  }

  const formData = new FormData();

  formData.append("asset", file, file.name);

  return fetch(`${CODEPRESS_HOST}/assets/${resourceId}`, {
    method: "POST",
    body: formData,
    redirect: "follow",
  })
    .then((x) => x.json())
    .then((x) => x.data.filepath)
    .catch((err) => {
      console.warn("[ERR]", err);
      toaster.error(`Could not upload\n${err.message}`);
    });
};

// Encode a JSON object as a URL hash
const encodeHash = pipe(
  (x: any) => JSON.stringify(x),
  encodeURIComponent,
  (x) => `#${x}`,
);

// Decode a URL hash containing a JSON object
const decodeHash = tryCatch(
  pipe(
    (x: string) => x.slice(1), // Strip leading hash
    decodeURIComponent,
    JSON.parse,
  ),
  (err) => {
    console.warn("[decodeHash] Could not decode hash.", err);
    return null;
  },
);

interface PWEditorComponentProps {
  node: Block | Mark;
  data: { [k: string]: any };
  children: React.ReactNode;
}

const StyledButton = styled(Button)`
  .bp3-icon {
    color: #da3a13 !important;
  }
`;

// An inline button that the user can click to quickly jump to our video.
const VideoPlayButton: React.FC<PWEditorComponentProps> = (props) => {
  return (
    <StyledButton
      id="VideoPlayButton"
      rightIcon="video"
      small
      onClick={scrollToVideoAndPlay}
    >
      {props.children}
    </StyledButton>
  );
};

// A button that will scroll down to the content area of teh page
const ContentScrollButton: React.FC<PWEditorComponentProps> = (props) => {
  return (
    <a
      href="#content-area"
      onClick={(e) => {
        e.preventDefault();
        scrollToContentArea();
      }}
    >
      {props.children}
    </a>
  );
};

// All adapted from the markdown shortcuts that ship with the lib by default:
// https://github.com/outline/rich-markdown-editor/blob/v9.11.2/src/plugins/MarkdownShortcuts.js
const MarkdownShortcuts = (): SlatePlugin => {
  const inlineShortcuts = [
    { mark: "bold", shortcut: "**" },
    { mark: "italic", shortcut: "_" },
    { mark: "code", shortcut: "`" },
    { mark: "inserted", shortcut: "++" },
    { mark: "deleted", shortcut: "~" },

    // This is our hack to support rendering custom components inot our
    // markdown. Surround a keyword with "@". See supported keywords below in
    // componentShortcuts
    { mark: "link", shortcut: "@" },
  ];

  // A mapping of text strings to component names.
  const componentShortcuts: Dictionary<string> = {
    "@video@": "VideoPlayButton",
    "@content@": "ContentScrollButton",
  };

  // A mapping of component names to actual components. Why two levels of
  // mapping? Serialization. We need to serialize the names of components into
  // markdown.
  const InlineComponentMap: Dictionary<React.FC<PWEditorComponentProps>> = {
    VideoPlayButton,
    ContentScrollButton,
  };

  // Given a list of leaves and a selection find in which indexed leaf the
  // selection is. It's basically the answer to "Which leaf is the cursor in?"
  const getIndexBySelection = (sel: Selection, leaves: List<Leaf>) => {
    let totalLength = 0;
    let index = -1;

    for (const { text } of leaves.toArray()) {
      totalLength += text.length;
      index += 1;
      if (sel.start.offset < totalLength) {
        return index;
      }
    }

    return -1;
  };

  const keydownWhitelist = new Set(inlineShortcuts.map((x) => x.shortcut[0]));

  // On special char handles inline markdown shortcuts. Support shortcuts are
  // listed in inlineShortcuts array
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
      // By using this text of the last leaf we avoid the issue of having a
      // previous char complete this string. For example, given the string
      // "italic uses `_` to make things _italic_" we want the first underscore
      // to be in a code tag and the word "italic" to be italicized. We do not
      // want the first underscore of "_italic_" to close out the previous on in
      // backticks
      const leaves = firstText.getLeaves();
      const selectionIndex = getIndexBySelection(selection, leaves);
      const selectionLeaf = leaves.get(selectionIndex);
      const text = selectionLeaf.text;
      const leadingText = leaves
        .slice(0, selectionIndex)
        .map((x: Leaf | undefined) => x?.text || "")
        .reduce((agg = "", x = "") => agg + x, "");
      const offsetFromStart = leadingText !== text ? leadingText.length : 0;
      const localOffset = selection.start.offset - leadingText.length;
      const potentialText =
        text.slice(0, localOffset) + e.key + text.slice(localOffset); // This is a keydown handler, so this is the text that would be on the page _after_ the press

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

        if (
          potentialText.slice(start, end) === shortcut &&
          (beginningOfBlock || endOfBlock || surroundedByWhitespaces) &&
          potentialText !== "```" // Special case to prevent ``` from turning into an inline code mark (because it should become a code block)
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

        let data = null;

        if (shortcut === "@") {
          const componentShortcut = potentialText.slice(
            firstCodeTagIndex - offsetFromStart,
            lastCodeTagIndex - offsetFromStart + 1,
          );
          if (componentShortcut in componentShortcuts) {
            data = {
              href: encodeHash({
                component: componentShortcuts[componentShortcut],
              }),
            };
          } else {
            console.warn(
              `Unrecognized "@" component: ${potentialText}. This will be ignored.`,
            );
          }
        }

        const markProperties = data ? { type: mark, data } : { type: mark };

        // NOTE: Order is important. If you you type a `, move to the end of a
        // word, type `, everything works. However if you put a ` at the end of
        // a word, move to the front, put another `, then this will not work.
        // For that to work we would have to do something like reverse the
        // arguments in moveAnchorTo and we probably wouldn't want to move to
        // the end afterwards. Even so, I was getting some sort of off-by-1
        // error when I tried to debug it.
        return editor
          .removeTextByKey(firstText.key, lastCodeTagIndex, shortcut.length)
          .removeTextByKey(firstText.key, firstCodeTagIndex, shortcut.length)
          .moveAnchorTo(firstCodeTagIndex, lastCodeTagIndex)
          .addMark(markProperties)
          .moveToEnd()
          .removeMark(markProperties);
      }
    }

    return next();
  };

  // Get the block type for a series of auto-markdown shortcut `chars`.
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

  // On space handles block-level markdown shortcuts
  const onSpace = (
    e: React.KeyboardEvent,
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

    // eslint-disable-next-line
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
      e.preventDefault();

      let checked: boolean | undefined;

      if (chars === "[x]") {
        checked = true;
      }
      if (chars === "[ ]") {
        checked = false;
      }

      // eslint-disable-next-line
      // @ts-ignore Slate types are not great
      editor.withoutNormalizing((c) => {
        c.moveFocusToStartOfNode(startBlock).delete().setBlocks({
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

    // Purposefully not passing to next here so that the rich-markdown-editor
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

  // We need to handle both nodes and marks, oddly. The rich markdown editor is
  // using renderMark when you first type the shortcut in the editor, so we use
  // that to render. After the document is saved and loaded back in from stored
  // markdown renderNode will be called instead.
  const _renderNodeOrMark = (
    node: Block | Mark,
    children: React.ReactNode,
    next: () => any,
  ) => {
    switch (node.type) {
      case "link": {
        const href = node.getIn(["data", "href"], "");

        // Just a standard link. Since we're overloading the link type this is the most likely codepath.
        if (!href || !href.startsWith("#")) {
          return next();
        }

        const data = decodeHash(href) || {};
        const InlineComponent = InlineComponentMap[data.component];

        // This would happen if one of us types a child value that does not correspond to a comp
        if (!InlineComponent) {
          console.warn(
            "You tried to render an inline component but none was found for type: ",
            node.type,
          );
          return next();
        }

        return (
          <InlineComponent node={node} data={data}>
            {children}
          </InlineComponent>
        );
      }
      default:
        return next();
    }
  };

  return {
    onKeyDown,
    renderNode: (props, _, next) =>
      _renderNodeOrMark(props.node, props.children, next),
    renderMark: (props, _, next) =>
      _renderNodeOrMark(props.mark, props.children, next),
  };
};

const markdownShortcuts = MarkdownShortcuts();

/** ===========================================================================
 * ContentEditor
 * ----------------------------------------------------------------------------
 * The ContentEditor is our rich markdown editor for use in Codepress for
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
class ContentEditor extends React.Component<IProps> {
  getSearchLinks = (searchTerm: string) => {
    // Kick off a search request...
    this.props.requestSearchResults(searchTerm);

    // An arbitrary amount of time later just pass the search results in
    return lastValueFrom(
      timer(600).pipe(
        map(() => {
          return this.props.searchResults.map((x) => ({
            title: x.title,
            url: `/workspace/${x.id}`,
          }));
        }),
      ),
    );
  };

  handleFileUpload = (file: File): Promise<string> => {
    return uploadFile(file, this.props.challengeId);
  };

  render() {
    const {
      history,
      plugins = [],
      challengeMap,
      appTheme,
      ...props
    } = this.props;
    return (
      <ErrorBoundary>
        <EditorExternalStyles>
          <RichMarkdownEditor
            plugins={[...plugins, markdownShortcuts]}
            theme={getEditorTheme(appTheme)}
            onSearchLink={this.getSearchLinks}
            uploadImage={this.handleFileUpload}
            onShowToast={(message) => {
              toaster.toast.show({
                message,
              });
            }}
            onClickLink={(href) => {
              const scrollTarget = getScrollTarget(href);

              if (scrollTarget) {
                const el = document.getElementById(scrollTarget);
                el?.scrollIntoView({
                  behavior: "smooth",
                });
              } else if (isInternalLink(href, challengeMap)) {
                history.push(href);
              } else {
                window.open(href, "_blank");
              }
            }}
            {...props}
          />
        </EditorExternalStyles>
      </ErrorBoundary>
    );
  }
}

/**
 * An error boundary to prevent errors from propagating up with being
 * caught from the lazy loaded RichMarkdownEditor. This does not do
 * anything except suppress the thrown error.
 */
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);

    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    // Update state with the error condition
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can also log the error to an error reporting service...
  }

  render() {
    return this.props.children;
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
const isInternalLink = (
  href: string,
  challengeMap: Nullable<InverseChallengeMapping>,
) => {
  // rich-markdown-editor adds 'https://' to the beginning of any href
  // that does not start with a forward slash, so just test that href
  // is a route and not a fully qualified URL
  if (!href.startsWith("http")) {
    const re = /^\/workspace\/(\w*)$/;
    const isChallengeRoute = href.match(re);

    // throw error if we provide an invalid id in workspace route
    // so that this does not get past us during development
    if (isChallengeRoute && challengeMap) {
      const challengeId = isChallengeRoute[1];
      if (!(challengeId in challengeMap) && challengeId !== SANDBOX_ID) {
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
  codeLight: "#232324",
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

const getEditorTheme = (appTheme: AppTheme) => {
  const isDark = appTheme === "dark";

  return {
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
    code: editorColors.almostWhite,

    text: isDark ? editorColors.almostWhite : editorColors.almostBlack,

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

    codeBackground: isDark ? editorColors.almostBlack : editorColors.codeLight,
    codeBorder: isDark ? editorColors.lightBlack : editorColors.greyMid,

    codeString: editorColors.codeString,
    horizontalRule: editorColors.lightBlack,
    imageErrorBackground: "rgba(0, 0, 0, 0.5)",
    hiddenToolbarButtons: {
      blocks: ["code"],
    },
  };
};

/**
 * The theme property of the markdown editor doesn't provide control over all
 * styles unfortunately, so some elements need to be styled externally.
 */
const EditorExternalStyles = styled.div`
  font-size: 17px;
  position: relative;

  // Highlighting inline text
  mark {
    background: #ffdf7538;
    border-bottom: 2px solid #ffdf75;
    ${themeText("white", "black")};
    padding: 0 3px;
    border-radius: 2px;
  }

  blockquote {
    margin-left: 0;
    font-style: normal !important;
    border-left-width: 9px !important;
    padding: 5px 20px 5px 10px !important;
    ${themeColor(
      "background",
      COLORS.LIGHT_GREY,
      COLORS.BACKGROUND_MODAL_LIGHT,
    )};
  }
  blockquote h1,
  blockquote h2,
  blockquote h3,
  blockquote h4 {
    margin-top: 4px;
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

  b,
  strong {
    font-weight: bold !important;
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
  appTheme: Modules.selectors.user.userSettings(state).appTheme,
  searchResults: Modules.selectors.challenges.getSearchResults(state),
  challengeId: Modules.selectors.challenges.getCurrentChallengeId(state),
  challengeMap: state.challenges.challengeMap,
});

const dispatchProps = {
  requestSearchResults: Modules.actions.challenges.requestSearchResults,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = RouteComponentProps & ConnectProps & EditorProps;

export default withRouter(
  connect(mapStateToProps, dispatchProps)(ContentEditor),
);
