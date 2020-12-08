import JSONPretty from "react-json-pretty";
import React from "react";
import cx from "classnames";
import styled, { CSSProperties } from "styled-components/macro";
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

export const DataCard = styled(Card)`
  margin-top: 12px;
  max-width: 625px;
  overflow-x: scroll;
  background: ${COLORS.BACKGROUND_MODAL} !important;
`;

export const KeyValue = ({
  code,
  label,
  value,
}: {
  code?: boolean;
  label: string;
  value: Nullable<string>;
}) => (
  <LabelRow>
    <Key>{label}:</Key>
    {code ? (
      value ? (
        <CodeValue onClick={() => copyToClipboard(value)}>{value}</CodeValue>
      ) : (
        <Code>null</Code>
      )
    ) : (
      <Value onClick={() => copyToClipboard(value)}>
        {value ? value : <Code>null</Code>}
      </Value>
    )}
  </LabelRow>
);

export const LabelRow = styled.div`
  height: 26px;
  display: flex;
  flex-direction: row;

  @media ${MOBILE} {
    height: 52px;
    flex-direction: column;
  }
`;

export const Key = styled(Text)`
  width: 250px;
  font-weight: 500;
  font-family: Avenir, Arial, Helvetica, sans-serif;
`;

export const Value = styled.p`
  color: ${COLORS.TEXT_CONTENT} !important;

  :hover {
    cursor: pointer;
    color: ${COLORS.TEXT_HOVER} !important;
  }

  @media ${MOBILE} {
    margin-top: 4px;
  }
`;

export const CodeValue = styled(Code)`
  color: #e97cff !important;
  background: ${COLORS.BACKGROUND_CONTENT} !important;

  :hover {
    cursor: pointer;
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
    json = <p>No data available.</p>;
  } else {
    json = (
      <JSONPretty
        id="json-pretty"
        data={data}
        theme={{
          key: "color:#fc426d;",
          value: "color:#e97cff;",
          string: "color:#ffd755;",
          main:
            "background:rgb(35,35,35);padding:8px;max-width:80vw;width:max-content;overflow:scroll;",
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
