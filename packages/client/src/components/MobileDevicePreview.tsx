import React from "react";
import styled from "styled-components/macro";

/** ===========================================================================
 * HTML & UI for Mobile Device Previews.
 * ----------------------------------------------------------------------------
 * See https://marvelapp.github.io/devices.css/ for details. We are using
 * the adapted version of this project which allows for resize-able mobile
 * devices (https://github.com/philipkiely/devices.css).
 *
 * The device styles and size settings are provided in the
 * mobile-device-styles.min.css file.
 *
 * NOTE: Currently this only supports default iOS and Android views. It could
 * be expanded in the future to support other device previews if we wanted.
 * ============================================================================
 */

export type MobileDevicePreviewType = "ios" | "android";

interface MobilePreviewUIProps {
  device: MobileDevicePreviewType;
  children: JSX.Element;
}

const MobilePreviewUI = (props: MobilePreviewUIProps) => {
  const { device, children } = props;
  const DeviceUI = device === "ios" ? IPhoneXMobilePreview : GalaxyNotePreview;

  return (
    <MobilePreviewContainer>
      <DeviceUI>{children}</DeviceUI>
    </MobilePreviewContainer>
  );
};

/** ===========================================================================
 * Device Styles
 * ============================================================================
 */

const IPhoneXMobilePreview = (props: { children: JSX.Element }) => {
  return (
    <div className="marvel-device iphone8plus black">
      <div className="top-bar"></div>
      <div className="sleep"></div>
      <div className="volume"></div>
      <div className="camera"></div>
      <div className="sensor"></div>
      <div className="speaker"></div>
      <div className="screen">{props.children}</div>
      <div className="home"></div>
      <div className="bottom-bar"></div>
    </div>
  );
};

const GalaxyNotePreview = (props: { children: JSX.Element }) => {
  return (
    <div className="marvel-device note8">
      <div className="inner"></div>
      <div className="overflow">
        <div className="shadow"></div>
      </div>
      <div className="speaker"></div>
      <div className="sensors"></div>
      <div className="more-sensors"></div>
      <div className="sleep"></div>
      <div className="volume"></div>
      <div className="camera"></div>
      <div className="screen">{props.children}</div>
    </div>
  );
};

/* eslint-disable */
const NexusPreview = (props: { children: JSX.Element }) => {
  return (
    <div className="marvel-device nexus5">
      <div className="top-bar"></div>
      <div className="sleep"></div>
      <div className="volume"></div>
      <div className="camera"></div>
      <div className="screen">{props.children}</div>
    </div>
  );
};

const MobilePreviewContainer = styled.div`
  padding-top: 6px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default MobilePreviewUI;
