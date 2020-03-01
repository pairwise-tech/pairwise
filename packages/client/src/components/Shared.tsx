import React, { SyntheticEvent, MouseEvent } from "react";
import cx from "classnames";
import styled, { CSSProperties } from "styled-components/macro";
import {
  Button,
  Icon,
  IconName,
  Classes,
  ButtonGroup,
} from "@blueprintjs/core";
import { NavLink, NavLinkProps } from "react-router-dom";
import pipe from "ramda/es/pipe";
import identity from "ramda/es/identity";
import { COLORS } from "../tools/constants";
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
export const Loading = () => {
  return <h1>Loading...</h1>;
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
  visibility: ${(props: { visible: boolean }) =>
    props.visible ? "visible" : "hidden"};
`;

export const OverlayText = styled.p`
  margin: 0;
  font-size: 42px;
  font-weight: 200;
  color: ${COLORS.PRIMARY_GREEN};
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
