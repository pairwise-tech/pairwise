import React from "react";

/** ===========================================================================
 * HTML for Mobile Device Previews
 * ----------------------------------------------------------------------------
 * See https://marvelapp.github.io/devices.css/ for details.
 * ============================================================================
 */

export const IPhoneXMobilePreview = (props: { children: JSX.Element }) => {
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

export const GalaxyNotePreview = (props: { children: JSX.Element }) => {
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
