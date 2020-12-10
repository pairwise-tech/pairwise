import Markdown from "react-markdown";
import JSONPretty from "react-json-pretty";
import React from "react";
import cx from "classnames";
import styled from "styled-components/macro";
import { Button, Code, Card, Text, Classes } from "@blueprintjs/core";
import { COLORS, MOBILE } from "../tools/constants";
import { copyToClipboard } from "../tools/admin-utils";

/** ===========================================================================
 * Admin Components
 * ============================================================================
 */

interface DarkThemeProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const DarkTheme = ({ className, ...props }: DarkThemeProps) => {
  return <div className={cx(className, Classes.DARK)} {...props} />;
};

export const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 20px 18px;
  margin-top: 32px;
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

export const SummaryText = styled.p`
  margin-bottom: 25px;
`;

export const DataCard = styled(Card)`
  margin-top: 12px;
  max-width: 625px;
  overflow-x: scroll;
  background: ${COLORS.BACKGROUND_CARD} !important;
`;

export const KeyValue = ({
  code,
  label,
  value,
  allowCopy,
  renderAsMarkdown,
}: {
  code?: boolean;
  label: string;
  allowCopy?: boolean;
  renderAsMarkdown?: boolean;
  value: Nullable<string>;
}) => {
  const handleCopy = () => {
    if (allowCopy) {
      copyToClipboard(value);
    }
  };
  return (
    <LabelRow>
      <Key>{label}:</Key>
      <span>
        {code ? (
          value ? (
            <CodeValue copy={(!!allowCopy).toString()} onClick={handleCopy}>
              {value}
            </CodeValue>
          ) : (
            <Code>null</Code>
          )
        ) : (
          <ValueContainer copy={(!!allowCopy).toString()} onClick={handleCopy}>
            {value ? (
              renderAsMarkdown ? (
                <Markdown source={value} />
              ) : (
                <Value>{value}</Value>
              )
            ) : (
              <Code>null</Code>
            )}
          </ValueContainer>
        )}
      </span>
    </LabelRow>
  );
};

export const LabelRow = styled.div`
  min-height: 26px;
  display: flex;
  flex-direction: row;

  @media ${MOBILE} {
    min-height: 52px;
    flex-direction: column;
  }
`;

export const Key = styled(Text)`
  width: 225px;
  font-weight: 500;
  font-family: Avenir, Arial, Helvetica, sans-serif;
`;

const ValueContainer = styled.div<{ copy: string }>`
  height: auto;
  max-width: 350px;

  ${props =>
    props.copy === "true" &&
    `
    :hover {
      cursor: pointer;
      color: ${COLORS.TEXT_HOVER} !important;
    }
  `}
`;

export const Value = styled.p`
  color: ${COLORS.TEXT_CONTENT} !important;

  @media ${MOBILE} {
    margin-top: 4px;
  }
`;

export const CodeValue = styled(Code)<{ copy: string }>`
  height: auto;
  color: #e97cff !important;
  background: ${COLORS.BACKGROUND_CONTENT} !important;

  :hover {
    cursor: ${props => (props.copy === "true" ? "pointer" : "auto")};
  }

  @media ${MOBILE} {
    margin-top: 4px;
  }
`;

export const JsonComponent = ({
  data,
  title,
}: {
  data: any;
  title?: string;
}) => {
  let json;
  if (Object.keys(data).length === 0) {
    json = <p style={{ color: "rgb(100,100,100)" }}>No data available.</p>;
  } else {
    json = (
      <JSONPretty
        id="json-pretty"
        data={data}
        theme={{
          key: "color:#fc426d;",
          value: "color:#e97cff;",
          string: "color:#ffd755;",
          main: `
              padding: 8px;
              max-width: 80vw;
              width: max-content;
              overflow: scroll;
              overscroll-behavior: none;
              background: rgb(35,35,35);
            `,
        }}
        style={{ fontSize: 14 }}
      />
    );
  }

  return (
    <>
      <p>{title}</p>
      {json}
    </>
  );
};

export const BreakLine = styled.div`
  margin-top: 12px;
  margin-bottom: 12px;
  border: 1px solid transparent;
  border-top-color: black;
  border-bottom-color: #353535;
`;

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

export const IconButton = styled(Button)`
  &:hover .bp3-icon:only-child {
    color: white !important;
  }
`;
