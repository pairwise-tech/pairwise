import React, { SyntheticEvent, MouseEvent } from "react";
import cx from "classnames";
import { EditorProps } from "rich-markdown-editor";
import styled, { CSSProperties } from "styled-components/macro";
import {
  Button,
  Icon,
  IconName,
  Classes,
  ButtonGroup,
} from "@blueprintjs/core";
import {
  NavLink,
  NavLinkProps,
  withRouter,
  RouteComponentProps,
} from "react-router-dom";
import pipe from "ramda/es/pipe";
import identity from "ramda/es/identity";
import { COLORS } from "../tools/constants";
import toaster from "tools/toast-utils";
import { IItemListRendererProps } from "@blueprintjs/select";
import {
  FEEDBACK_TYPE,
  CHALLENGE_TYPE,
  ContentUtility,
} from "@pairwise/common";

const RichMarkdownEditor = React.lazy(() => import("rich-markdown-editor"));

interface DarkThemeProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const DarkTheme = ({ className, ...props }: DarkThemeProps) => {
  return <div className={cx(className, Classes.DARK)} {...props} />;
};

// TODO: This could be made a bit more friendly. Maybe a spinner of some sort
export const Loading = () => {
  return <h1>Loading...</h1>;
};

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

/**
 * RichMarkdownEditor `onClickLink` callback helper function to determine
 * if href is custom scroll target. If so, override default behavior and
 * smooth scroll to target. In editor, you must set the link's href to:
 * `/scrollTarget/<id-to-scroll-to>`
 */
const getScrollTarget = (href: string) => {
  const re = /^\/scrollTarget\/([\w-]+)$/;
  const match = href.match(re);

  if (match) {
    return match[1];
  }
};

/**
 * RichMarkdownEditor `onClickLink` callback helper function to determine
 * if href is Pairwise internal link. If so, override default behavior and
 * use RR to navigate to route. In editor, set the link's href to: `/<route>`
 */
const isInternalLink = (href: string) => {
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

/**
 * The ContentEditor is our rich markdown editor for use in codepress for
 * editing and in the overall app for viewing markdown content.
 *
 * This export attaches the theme and any other props that are unlikely to
 * change if the editor is used in different places.
 *
 * @NOTE Render this within <Suspense />. React will throw a helpful error if not
 */
export const ContentEditor = withRouter(
  (props: EditorProps & RouteComponentProps) => (
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
  ),
);

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

export const UpperRight = styled.div<{ isEditMode: boolean }>`
  position: absolute;
  z-index: 2;
  right: 20px;
  top: ${props => (props.isEditMode ? 45 : 10)}px;
  display: flex;
  flex-direction: column;
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

/**
 * Modal Styles
 */
export const ModalContainer = styled.div`
  width: 525px;
  padding: 32px;
  padding-top: 22px;
  left: 50%;
  top: 50%;
  outline: none;
  position: absolute;
  background: black;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  transform: translate(-50%, -50%);
  border-radius: 6px;
  border: 1px solid ${COLORS.BORDER_MODAL};
  background-color: ${COLORS.BACKGROUND_MODAL};
`;

export const ModalTitleText = styled.h1`
  font-size: 24px;
  font-weight: 300;
  text-align: center;
  color: ${COLORS.TEXT_WHITE};
  font-family: Helvetica Neue, Lato, sans-serif;
`;

export const ModalSubText = styled(ModalTitleText)`
  font-size: 16px;
  margin-top: 12px;
  max-width: 350px;
  font-weight: 300;
`;

/**
 * Used to Smooth Scroll from Workspace to Content Area and Vice Versa
 */
interface HalfCircleProps {
  position: "top" | "bottom";
  positionOffset: number;
  backgroundColor: string;
}

export const HalfCircle = styled.div<
  HalfCircleProps & React.HTMLProps<HTMLButtonElement>
>`
  &:hover {
    background: ${props => props.backgroundColor};
  }

  align-items: center;
  cursor: pointer;
  display: flex;
  height: 30px;
  justify-content: center;
  left: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
  transition: background 0.3s;
  width: 60px;

  border-${props =>
    props.position === "top" ? "bottom" : "top"}-left-radius: 90px;
  border-${props =>
    props.position === "top" ? "bottom" : "top"}-right-radius: 90px;
  ${props => props.position}: ${props => props.positionOffset}px;
`;

type SmoothScrollButtonProps = {
  icon: "chevron-down" | "chevron-up";
  scrollToId: string;
} & HalfCircleProps;

export const SmoothScrollButton = ({
  icon,
  scrollToId,
  position,
  positionOffset,
  backgroundColor,
}: SmoothScrollButtonProps) => {
  return (
    <HalfCircle
      position={position}
      positionOffset={positionOffset}
      backgroundColor={backgroundColor}
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        const el = document.getElementById(scrollToId);
        el?.scrollIntoView({
          behavior: "smooth",
        });
      }}
    >
      <Icon iconSize={22} icon={icon} />
    </HalfCircle>
  );
};

/**
 * the getRenderItemList and labelByType functions are helpers used by our
 * BlueprintJs Select components: FeedbackTypeMenu and ChallengeTypeMenu
 */
export const getRenderItemList = (listMinWidth: number) => {
  return function renderItemList<T>({
    renderItem,
    items,
  }: IItemListRendererProps<T>) {
    return (
      <ButtonGroup
        fill
        vertical
        alignText="left"
        style={{ minWidth: listMinWidth }}
      >
        {items.map(renderItem)}
      </ButtonGroup>
    );
  };
};

export function labelByType<
  T extends { value: FEEDBACK_TYPE | CHALLENGE_TYPE; label: string }
>(type: string | undefined, items: T[]) {
  const item = items.find(x => x.value === type);
  return item?.label || type;
}

// Quick shorthand component for rendering an href link to an external URL.
// NOTE: This is basically duplicated in the client workspace package. We
// could at some point consolidate shared UI components in the common
// package, but there doesn't feel to be a strong need to do so now.
export const ExternalLink = ({
  link,
  style,
  children,
}: {
  link: string;
  children: string;
  style?: React.CSSProperties;
}) => {
  return (
    <a
      href={link}
      target="__blank"
      rel="noopener noreferrer"
      style={{ ...style }}
    >
      {children}
    </a>
  );
};
