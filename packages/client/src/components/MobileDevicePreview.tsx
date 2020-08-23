import React from "react";

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
