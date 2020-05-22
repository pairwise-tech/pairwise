import React from "react";
import { SupplementaryContentContainer, TitleHeader } from "./Shared";
import { Button } from "@blueprintjs/core";

const MobileView = () => {
  return (
    <SupplementaryContentContainer id={"mobile-landing-page"}>
      <TitleHeader>Welcome to Pairwise on Mobile</TitleHeader>
      <p>Hey there</p>
      <Button>Sup sup</Button>
    </SupplementaryContentContainer>
  );
};

export default MobileView;
