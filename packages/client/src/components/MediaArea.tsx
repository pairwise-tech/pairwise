import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { ContentInput, StyledMarkdown, Text } from "./shared";
import { EditableText } from "@blueprintjs/core";

/**
 * The media area. Where supplementary content and challenge videos live. The media area can also serve as the standalone UI for a challenge that is all information, without any interactive coding practice.
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  title: Modules.selectors.challenges.getCurrentTitle(state) || "",
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  isEditMode: Modules.selectors.challenges.isEditMode(state),
});

const dispatchProps = {
  updateChallenge: Modules.actions.challenges.updateChallenge,
};

type MediaAreaProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

const MediaArea = connect(
  mapStateToProps,
  dispatchProps,
)((props: MediaAreaProps) => {
  const { challenge, title, isEditMode } = props;

  if (!challenge) {
    return <h1>Loading...</h1>;
  }

  const handleTitle = (x: string) =>
    props.updateChallenge({ id: challenge.id, challenge: { title: x } });

  const handleContent = (supplementaryContent: string) => {
    props.updateChallenge({
      id: challenge.id,
      challenge: { supplementaryContent },
    });
  };

  return (
    <SupplementaryContentContainer>
      <TitleHeader>
        <EditableText
          value={title}
          onChange={handleTitle}
          disabled={!isEditMode}
        />
      </TitleHeader>
      {isEditMode ? (
        <ContentInput
          value={challenge.supplementaryContent}
          onChange={handleContent}
        />
      ) : (
        <StyledMarkdown source={challenge.supplementaryContent} />
      )}
      <Text>
        <b>Video:</b>{" "}
        {challenge.videoUrl ? challenge.videoUrl : "No video available"}
      </Text>
      {challenge.videoUrl && <YoutubeEmbed url={challenge.videoUrl} />}
    </SupplementaryContentContainer>
  );
});

export default MediaArea;

const SupplementaryContentContainer = styled.div`
  padding: 25px;
  padding-left: 12px;
  padding-right: 12px;
  background: #1e1e1e;
`;

/**
 * Copied the iframe props form the share sheet on youtube.
 *
 * NOTE: This iframe can be hidden for ease of development. If not actively
 * developing video-related features, loading a youtube iframe causes all sorts
 * of network traffic which both slows down page loads (a big pain in dev) and
 * clutters up the network panel with a bunch of requests we're not interested
 * in.
 */
const YoutubeEmbed = (props: { url: string }) => {
  const width = 728;
  const height = 410;

  if (process.env.REACT_APP_HIDE_EMBEDS) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#999",
        }}
      >
        <h3 style={{ textTransform: "uppercase" }}>Embed Hidden</h3>
        <p>
          Restart the app without <code>REACT_APP_HIDE_EMBEDS</code> to view
          embeds
        </p>
      </div>
    );
  }

  return (
    <iframe
      title="Youtube Embed"
      width={width}
      height={height}
      src={props.url}
      frameBorder="0"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    ></iframe>
  );
};

const TitleHeader = styled.h1`
  font-size: 3em;
`;
