import React from "react";
import { SupplementaryContentContainer, TitleHeader } from "./Shared";
import { Button } from "@blueprintjs/core";
import { YoutubeEmbed } from "./MediaArea";
import styled from "styled-components/macro";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import Modules from "modules/root";

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
