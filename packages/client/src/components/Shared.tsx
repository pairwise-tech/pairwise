import React, { Suspense, SyntheticEvent } from "react";
import Markdown, { ReactMarkdownProps } from "react-markdown";
import cx from "classnames";
import { EditorProps } from "rich-markdown-editor";

import styled, { CSSProperties } from "styled-components/macro";
import {
  EditableText,
  IEditableTextProps,
  Button,
  Icon,
  IconName,
  Classes,
} from "@blueprintjs/core";
import { NavLink, NavLinkProps } from "react-router-dom";
import pipe from "ramda/es/pipe";
import identity from "ramda/es/identity";

import { COLORS, PROSE_MAX_WIDTH, AppToaster } from "../tools/constants";

const RichMarkdownEditor = React.lazy(() => import("rich-markdown-editor"));

export const LazyCodeBlock = React.lazy(() => import("./CodeBlock"));

interface DarkThemeProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const DarkTheme = ({ className, ...props }: DarkThemeProps) => {
  return (
    <div className={`pairwise ${cx(className, Classes.DARK)}`} {...props} />
  );
};

// TODO: This could be made a bit more friendly. Maybe a spinner of some sort
export const Loading = () => {
  return <h1>Loading...</h1>;
};

// Adapted from: https://github.com/outline/rich-markdown-editor/blob/master/src/theme.js
const editorColors = {
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

  // Inline code
  p code {
    color: rgb(108, 188, 255);
  }

  .prism-token.token {
    // color: #9bdbfd;
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

/**
 * The ContentEditor is our rich markdown editor for use in codepress for
 * editing and in the overall app for viewing markdown content.
 *
 * This export attaches the theme and any other props that are unlikely to
 * change if the editor is used in different places.
 *
 * @NOTE Render this within <Suspense />. React will throw a helpful error if not
 */
export const ContentEditor = (props: EditorProps) => (
  <EditorExternalStyles>
    <RichMarkdownEditor
      theme={editorTheme}
      onShowToast={message => {
        AppToaster.show({
          message,
        });
      }}
      {...props}
    />
  </EditorExternalStyles>
);

const InlineCode = ({ value }: { value: string }) => {
  return <code className="code">{value}</code>;
};

export const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 25px;
`;

export const ButtonCore = styled.button`
  background: none repeat scroll 0 0 transparent;
  border: medium none;
  border-spacing: 0;
  font-family: "PT Sans Narrow", sans-serif;
  font-size: 16px;
  font-weight: normal;
  line-height: 1.42rem;
  list-style: none outside none;
  margin: 0;
  padding: 0;
  text-align: left;
  text-decoration: none;
  text-indent: 0;

  :focus {
    outline: none;
  }
`;

/**
 * A blueprint EditableText that will not respond to escape key events. See
 * NOTE below for details.
 */
const NoCancelContentInput = (props: IEditableTextProps) => {
  const [confirmedContent, setConfirmedContent] = React.useState<string>(
    props.value || "",
  );
  const handleChange = (supplementaryContent: string) => {
    if (!props.onChange) {
      return;
    }

    /**
     * NOTE: Blueprintjs has a just terrible cancel feature on their editable
     * inputs. If you hit escape it reverts the text to its "last confirmed
     * value". This would be fine if it could be configured or disabled, but it
     * cannot. It's far too easy to accidentally hit escape and loose all the
     * copy you've written. This is meant to be a workaround for that. Upgrading
     * to a rich-markdown editor (like Slate) will solve this since we can move
     * away from this blueprint component.
     */
    if (confirmedContent === supplementaryContent) {
      console.warn("[INFO] Ignoring update. Probably was escape key");
      return;
    }

    props.onChange(supplementaryContent);
  };

  const handleConfirm = (x: string) => {
    setConfirmedContent(x);
    if (props.onConfirm) {
      props.onConfirm(x);
    }
  };

  return (
    <div style={{ maxWidth: PROSE_MAX_WIDTH }}>
      <EditableText
        multiline
        minLines={3}
        {...props}
        onChange={handleChange}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export const ContentInput = styled(NoCancelContentInput)`
  font-size: 1.1em;
  line-height: 1.5;
  transition: background 0.2s ease-out;
  &:focus {
    background: black;
  }
`;

const HighlightedMarkdown = (props: ReactMarkdownProps) => {
  return (
    <Suspense fallback={<pre>Loading...</pre>}>
      <Markdown
        renderers={{
          code: LazyCodeBlock,
          inlineCode: InlineCode,
        }}
        {...props}
      />
    </Suspense>
  );
};

export const StyledMarkdown = styled(HighlightedMarkdown)`
  max-width: ${PROSE_MAX_WIDTH}px;
  color: white;
  line-height: 1.5;
  font-size: 1.1rem;

  .code {
    background: rgba(255, 255, 255, 0.1);
    padding: 1px 3px;
    display: inline;
    /* color: #ff4788; */
    /* color: rgb(0, 255, 185); */
    color: rgb(108, 188, 255);
    border-radius: 3px;
    line-height: normal;
    font-size: 85%;
  }
`;

export const PageTitle = styled.h1`
  margin-top: 0;
  color: ${COLORS.TEXT_WHITE};
`;

export const Text = styled.p`
  margin: 0;
  margin-top: 8px;
  font-size: 15px;
  font-weight: 200px;
  color: ${COLORS.TEXT_CONTENT};
`;

export const LowerRight = styled.div`
  position: absolute;
  z-index: 2;
  right: 20px;
  bottom: 10px;
  display: flex;
  flex-direction: column;
`;

export interface IconNavLinkProps extends NavLinkProps {
  icon: IconName;
  disabled: boolean;
  beforeText?: string;
  afterText?: string;
}

export const preventDefault = (e: SyntheticEvent) => {
  e.preventDefault();
  return e;
};

/**
 * NOTE: I wasn't sure how to type this usage of pipe. This is quite a bit
 * convoluted, when all I really want was the styling from a blueprint button on
 * top of a RR link. However, by restyling a link
 */
export const IconNavLink = styled(
  ({
    icon,
    className,
    disabled = false,
    beforeText,
    afterText,
    ...props
  }: IconNavLinkProps) => {
    const onClick = disabled ? preventDefault : identity;
    // @ts-ignore See NOTE
    // prettier-ignore
    const handleClick = props.onClick ? pipe(onClick, props.onClick) : onClick;

    /**
     * NOTE: There is some dispatch prop which React shows a warning about if
     * it is include in the <a> props below...
     */
    // @ts-ignore
    const { dispatch, ...rest } = props;

    return (
      <NavLink
        className={cx(className, Classes.BUTTON, {
          [Classes.DISABLED]: disabled,
        })}
        {...rest}
        onClick={handleClick}
      >
        {beforeText && <span style={{ marginRight: 6 }}>{beforeText}</span>}
        <Icon icon={icon} />
        {afterText && <span style={{ marginLeft: 6 }}>{afterText}</span>}
      </NavLink>
    );
  },
)`
  &:hover .bp3-icon:only-child {
    color: white !important;
  }

  .bp3-icon:only-child {
    color: rgba(255, 255, 255, 0.8) !important;
  }
`;

export const IconButton = styled(Button)`
  &:hover .bp3-icon:only-child {
    color: white !important;
  }

  .bp3-icon:only-child {
    color: rgba(255, 255, 255, 0.8) !important;
  }
`;

/**
 * TODO: Render a default Pairwise user avatar icon if there is no profile
 * avatar.
 */
export const ProfileIcon = ({
  avatar,
  width,
  height,
  style,
}: {
  avatar: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
}) => {
  const src = avatar
    ? avatar
    : "https://avatars0.githubusercontent.com/u/59724684?s=200&v=4";

  return (
    <img
      src={src}
      width={width || 32}
      height={height || 32}
      alt="Profile Avatar"
      style={{ borderRadius: "50%", ...style }}
    />
  );
};
