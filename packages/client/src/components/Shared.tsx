import React, { SyntheticEvent, MouseEvent } from "react";
import cx from "classnames";
import styled, { CSSProperties } from "styled-components/macro";
import {
  Button,
  Icon,
  IconName,
  Classes,
  ButtonGroup,
  Spinner,
} from "@blueprintjs/core";
import { NavLink, NavLinkProps } from "react-router-dom";
import pipe from "ramda/es/pipe";
import identity from "ramda/es/identity";
import { COLORS, MOBILE } from "../tools/constants";
import { IItemListRendererProps } from "@blueprintjs/select";
import { FEEDBACK_TYPE, CHALLENGE_TYPE } from "@pairwise/common";

interface DarkThemeProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const DarkTheme = ({ className, ...props }: DarkThemeProps) => {
  return <div className={cx(className, Classes.DARK)} {...props} />;
};

// TODO: This could be made a bit more friendly. Maybe a spinner of some sort
export const Loading = styled(Spinner)`
  margin-top: 10px;
`;

export const LoadingInline = () => {
  return <small style={{ display: "inline-block" }}>Loading...</small>;
};

export const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 25px;
  margin-top: 60px;
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

// NOTE: Trying to bolt mobile styling onto the existing UI without changing any
// DOM or desktop styles is a bit cumbersome. I regard the app as very much
// desktop first so I wanted to touch desktop as little as possible. However,
// rather than using a nice constraint-based layout I'm using an absolute pixel
// value here becuase I don't want to rearrange the DOM.
export const CodeEditorUpperRight = styled.div<{ isEditMode: boolean }>`
  position: absolute;
  z-index: 3;
  right: 20px;
  top: ${props => (props.isEditMode ? 45 : 10)}px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  @media ${MOBILE} {
    top: auto;
    bottom: 1px; // Just give a line of contrast in case our colors are the same as your phone UI (ios problem)
    right: 0;
    left: 122px; // Yeah... I don't love this. See the NOTE
  }
`;

// This breaks the Icon typing, but also doesn't shout at us in the console
export const RotatingIcon = styled(({ isRotated, id, ...props }) => {
  return <Icon id={id} {...props} />;
})<{ isRotated?: boolean; id: string }>`
  transform: ${props =>
    `rotate3d(0,0,1,${props.isRotated ? "0deg" : "-90deg"})`};
  transition: transform 0.2s linear;
`;

export const LowerRight = styled.div`
  position: absolute;
  z-index: 3;
  right: 20px;
  bottom: 10px;
  display: flex;
  flex-direction: column;

  @media ${MOBILE} {
    top: auto;
    right: auto;
    left: 0;
    bottom: 1px; // Just give a line of contrast in case our colors are the same as your phone UI (ios problem)
    flex-direction: row;
  }
`;

export const FullScreenOverlay = styled.div`
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 500;
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 15, 15, 0.95);
  visibility: ${({ visible = true }: { visible?: boolean }) =>
    visible ? "visible" : "hidden"};
`;

export const OverlayText = styled.p`
  margin: 0;
  font-size: 42px;
  font-weight: 200;
  text-align: center;
  color: ${(props: { error?: boolean }) =>
    props.error ? COLORS.LIGHT_FAILURE : COLORS.PRIMARY_GREEN};
`;

export const OverlaySmallText = styled.p`
  margin: 0;
  margin-top: 32px;
  font-size: 22px;
  font-weight: 200;
  text-align: center;
  color: ${COLORS.LIGHT_FAILURE};
`;

export interface IconNavLinkProps extends NavLinkProps {
  icon: IconName;
  disabled: boolean;
  beforeText?: string;
  afterText?: string;
  large?: boolean;
  fill?: boolean;
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
    const { dispatch, fill, large, ...rest } = props;

    return (
      <NavLink
        className={cx(className, Classes.BUTTON, {
          [Classes.DISABLED]: disabled,
          "bp3-large": large,
          fill,
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
  &.fill {
    width: 100%;
  }

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
  const PAIRWISE_LOGO =
    "https://avatars0.githubusercontent.com/u/59724684?s=200&v=4";

  const src = avatar ? avatar : PAIRWISE_LOGO;

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
  min-height: 510px;
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

  @media ${MOBILE} {
    width: 100%;
  }
`;

export const ModalTitleText = styled.h1`
  font-size: 28px;
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

export const HalfCircle = styled.div<HalfCircleProps>`
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

export const CodeEditorContainer = styled.div`
  height: 100%;
  position: relative;

  // Make room forcode editor controls
  @media ${MOBILE} {
    padding-bottom: 41px;
  }
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

export const DesktopOnly = styled.div`
  @media ${MOBILE} {
    display: none;
  }
`;

export const LineWrappedText = styled.p`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

export const Hr = styled.hr`
  border: 1px solid transparent;
  border-top-color: black;
  border-bottom-color: #353535;
`;

export const SupplementaryContentContainer = styled.div`
  padding: 50px 25px 25px 25px;
  background: #1e1e1e;
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;

  @media ${MOBILE} {
    padding-left: 12px;
    padding-right: 12px;
  }
`;

export const TitleHeader = styled.h1`
  margin-top: -6px; /* align closely with breadcrumbs */
  font-size: 3em;
`;

export const Highlight = styled.mark`
  font-weight: bold;
  color: white;
  background: #ffdf7538;
  border-bottom: 2px solid #ffdf75;
`;

// NOTE: 16:9 aspect ratio. All our videos should be recorded at 1080p so this
// should not be a limitation. See this post for the logic on this aspect ratio CSS:
// https://css-tricks.com/NetMag/FluidWidthVideo/Article-FluidWidthVideo.php
export const VideoWrapper = styled.div`
  position: relative;
  padding-bottom: 56.25%; /* See NOTE  */
  padding-top: 25px;
  height: 0;
  margin-bottom: 40px;
  border: 1px solid #444444;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 1px 15px rgba(0, 0, 0, 0.48);

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 100%;
  }
`;

export const DefaultVideoWrapper = styled(VideoWrapper)`
  height: 410px;
  width: 100%;
  padding: 0;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  background: ${COLORS.BACKGROUND_CONTENT};
`;

export const LastChildMargin = styled.div`
  &:last-child {
    margin-right: 0;
    margin-bottom: 0;
  }
`;

type PairwiseOpenCloseLogoProps = { isOpen?: boolean } & React.SVGProps<
  SVGSVGElement
>;

export const PairwiseOpenCloseLogo = ({
  isOpen = false,
  ...props
}: PairwiseOpenCloseLogoProps) => {
  return (
    <svg
      width="24.44"
      height="20"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fillRule="nonzero" fill="none" transform="scale(0.37)">
        <rect
          fill="#27C9DD"
          x="0"
          y="0"
          width={isOpen ? 50 : 12}
          height="8"
          rx="3.774"
        />
        <rect
          fill="#FFB85A"
          x="0"
          y="46"
          width={isOpen ? 50 : 15}
          height="8"
          rx="3.774"
        />
        <rect
          fill="#F3577A"
          x="0"
          y="16"
          width={isOpen ? 50 : 25}
          height="8"
          rx="3.774"
        />
        <rect
          fill="#F6FA88"
          x="0"
          y="31"
          width={isOpen ? 50 : 34}
          height="8"
          rx="3.774"
        />
        <rect
          fill="#F3577A"
          x={!isOpen ? 24 : 56}
          y="46"
          width={isOpen ? 10 : 42}
          height="8"
          rx="3.774"
        />
        <rect
          fill="#FFB85A"
          x={!isOpen ? 42 : 56}
          y="31"
          width={isOpen ? 10 : 24}
          height="8"
          rx="3.774"
        />
        <rect
          fill="#49F480"
          x={!isOpen ? 21 : 56}
          y="0"
          width={isOpen ? 10 : 45}
          height="8"
          rx="3.774"
        />
        <rect
          fill="#27C9DD"
          x={!isOpen ? 33 : 56}
          y="16"
          width={isOpen ? 10 : 33}
          height="8"
          rx="3.774"
        />
      </g>
    </svg>
  );
};
