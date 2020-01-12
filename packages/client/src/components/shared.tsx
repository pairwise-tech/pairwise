import React, { Suspense, SyntheticEvent } from "react";
import Markdown, { ReactMarkdownProps } from "react-markdown";
import styled from "styled-components/macro";
import cx from "classnames";

import { COLORS } from "../tools/constants";
import {
  EditableText,
  IEditableTextProps,
  Button,
  Icon,
  IconName,
  IButtonProps,
  Classes,
} from "@blueprintjs/core";
import { NavLink, NavLinkProps } from "react-router-dom";
import pipe from "ramda/es/pipe";
import identity from "ramda/es/identity";

const PROSE_MAX_WIDTH = 728;

const LazyCodeBlock = React.lazy(() => import("./CodeBlock"));

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
    return (
      <NavLink
        className={cx(className, Classes.BUTTON, {
          [Classes.DISABLED]: disabled,
        })}
        {...props}
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
