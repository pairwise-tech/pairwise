import React from "react";
import { EditorProps } from "rich-markdown-editor";
import { withRouter, RouteComponentProps } from "react-router-dom";
import toaster from "tools/toast-utils";
import { ContentUtility } from "@pairwise/common";
import styled from "styled-components";
import { COLORS } from "tools/constants";

const RichMarkdownEditor = React.lazy(() => import("rich-markdown-editor"));

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
 * ============================================================================
 */
const ContentEditor = (props: EditorProps & RouteComponentProps) => (
  <EditorExternalStyles>
    <RichMarkdownEditor
      theme={editorTheme}
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
          props.history.push(href);
        } else {
          window.open(href, "_blank");
        }
      }}
      {...props}
    />
  </EditorExternalStyles>
);

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
      // this should not get past us during development!
      if (!ContentUtility.challengeIdIsValid(challengeId)) {
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

  toolbarBackground: editorColors.white,
  toolbarInput: editorColors.black10,
  toolbarItem: editorColors.lightBlack,

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
  max-width: 728px;
  position: relative;

  blockquote {
    margin-left: 10px !important;
    background: ${COLORS.LIGHT_GREY} !important;
    font-style: normal !important;
    border-left-width: 9px !important;
    padding: 5px 20px 5px 10px !important;
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

export default withRouter(ContentEditor);
