import React from "react";
import styled from "styled-components/macro";
import { OverlayText } from "./Shared";

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

/** ===========================================================================
 * Pairwise Screensaver Component
 * ============================================================================
 */

class PairwiseScreensaver extends React.Component {
  render() {
    const gradient = {
      a: 0,
      b: 0,
      c: 0,
      d: 0,
    };
    return (
      <ScreensaverOverlay
        visible
        gradient={gradient}
        data-selector="pairwise-screensaver-overlay"
      >
        <div>
          <OverlayText id="pairwise-screensaver">
            Pairwise Screensaver...
          </OverlayText>
        </div>
      </ScreensaverOverlay>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

interface ScreensaverOverlayProps {
  visible: boolean;
  gradient: GradientScales;
}

const ScreensaverOverlay = styled.div<ScreensaverOverlayProps>`
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1500;
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(15, 15, 15, 0.95);
  background-image: ${(props: { gradient: GradientScales }) => {
    return `linear-gradient(43deg, #F3577A 0%, #27C9DD 46%, #FFB85A 67%, #F6FA88 100%)`;
  }};
  visibility: ${({ visible = true }: { visible?: boolean }) =>
    visible ? "visible" : "hidden"};
`;

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default PairwiseScreensaver;
