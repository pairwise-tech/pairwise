import React from "react";
import { SupplementaryContentContainer, TitleHeader } from "./Shared";
import { Button, Callout } from "@blueprintjs/core";
import { YoutubeEmbed } from "./MediaArea";
import styled from "styled-components/macro";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import Modules from "modules/root";
import isMobile from "is-mobile";

const LargeButton = styled(Button)`
  width: 100%;
`;

const MobileView = (props: Props) => {
  return (
    <SupplementaryContentContainer
      style={{ marginTop: 30 }}
      id={"mobile-landing-page"}
    >
      <TitleHeader>Welcome to Pairwise on Mobile</TitleHeader>
      {!isMobile() && (
        <Callout style={{ marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>Not on mobile?</h3>
          <p>
            It looks like you're not on mobile, so you can most likely disregard
            this page.
          </p>
        </Callout>
      )}
      <YoutubeEmbed url={"https://www.youtube.com/embed/oIL0qeS6Txg"} />
      <LargeButton
        style={{ marginBottom: 20 }}
        large
        onClick={() => {
          props.setFeedbackDialogState(true);
          props.setFeedbackType("OTHER");
          props.setFeedbackState(
            "I want to use Pairwise on mobile. Here's why:",
          );
        }}
      >
        Request Mobile Support
      </LargeButton>
      <Link to={`/workspace/iSF4BNIl/hello-pairwise`}>
        <LargeButton intent={"success"} large>
          Start Coding
        </LargeButton>
      </Link>
    </SupplementaryContentContainer>
  );
};

type Props = typeof Modules.actions.feedback;

export default connect(null, Modules.actions.feedback)(MobileView);
