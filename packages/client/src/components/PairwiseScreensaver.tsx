import React from "react";
import styled from "styled-components/macro";
import PairwiseLogo from "../icons/logo-square@1024.png";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface GradientScales {
  a: number;
  b: number;
  c: number;
  d: number;
}

interface IProps {}

interface IState {}

/** ===========================================================================
 * Pairwise Screensaver Component
 * ============================================================================
 */

class PairwiseScreensaver extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <ScreensaverOverlay visible data-selector="pairwise-screensaver-overlay">
        <ContentBlock>
          <img width={85} height={85} src={PairwiseLogo} alt="Pairwise Logo" />
          <QuoteBlock>
            <Quote>
              "Programs must be written for people to read, and only
              incidentally for machines to execute."
            </Quote>
            <Author>― Harold Abelson</Author>
          </QuoteBlock>
        </ContentBlock>
      </ScreensaverOverlay>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const ContentBlock = styled.div`
  padding: 20px;
  top: 150px;
  left: 50px;
  width: 600px;
  min-height: 150px;
  position: absolute;
  border-radius: 8px;
  display: flex;
  align-items: center;
  background-color: rgba(15, 15, 15, 0.875);
`;

const QuoteBlock = styled.div`
  padding-left: 24px;
`;

const Quote = styled.p`
  font-family: "Courier New", Courier, monospace;
  color: white;
  font-size: 16px;
`;

const Author = styled.p`
  font-family: Verdana, Geneva, sans-serif;
  color: white;
  font-size: 14px;
`;

interface ScreensaverOverlayProps {
  visible: boolean;
}

/**
 * Gradient animation created with https://www.gradient-animator.com/.
 */
const ScreensaverOverlay = styled.div<ScreensaverOverlayProps>`
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100vh;
  position: fixed;
  z-index: 1500;
  overflow: hidden;
  visibility: ${({ visible = true }: { visible?: boolean }) =>
    visible ? "visible" : "hidden"};

  background: linear-gradient(270deg, #f3577a, #27c9dd, #ffb85a, #f6fa88);
  background-size: 800% 800%;

  -webkit-animation: PairwiseScreensaver 40s ease infinite;
  -moz-animation: PairwiseScreensaver 40s ease infinite;
  animation: PairwiseScreensaver 40s ease infinite;

  @-webkit-keyframes PairwiseScreensaver {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  @-moz-keyframes PairwiseScreensaver {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  @keyframes PairwiseScreensaver {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default PairwiseScreensaver;
