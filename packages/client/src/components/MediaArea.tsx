import Modules, { ReduxStoreState } from "modules/root";
import { debounce } from "throttle-debounce";
import React, { ChangeEvent, Suspense } from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Loading, ContentEditor } from "./Shared";
import { EditableText, Callout, Classes } from "@blueprintjs/core";
import { NextChallengeCard } from "./ChallengeControls";
import { PROSE_MAX_WIDTH, CONTENT_SERIALIZE_DEBOUNCE } from "tools/constants";
import { SlatePlugin } from "rich-markdown-editor";
import TableOfContents from "./TableOfContents";

const TableOfContentsPlugin = (): SlatePlugin => {
  const renderEditor: SlatePlugin["renderEditor"] = (props, editor, next) => {
    const children = next();

    return (
      <>
        <TableOfContents editor={editor} />
        {children}
      </>
    );
  };

  return { renderEditor };
};

/**
 * The media area. Where supplementary content and challenge videos live. The
 * media area can also serve as the standalone UI for a challenge that is all
 * information, without any interactive coding practice.
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
)(({ challenge, title, isEditMode, updateChallenge }: MediaAreaProps) => {
  if (!challenge) {
    return <Loading />;
  }

  const handleTitle = (x: string) =>
    updateChallenge({ id: challenge.id, challenge: { title: x } });

  const tableOfContents = React.useMemo(() => TableOfContentsPlugin(), [
    challenge.id,
  ]);

  /**
   * @NOTE The function is memoized so that we're not constantly recreating the
   * debounced function.
   * @NOTE The function is debounced because serializing to markdown has a
   * non-trivial performance impact, which is why the underlying lib provides a
   * getter function rather than the string value onChange.
   */
  const handleContent = React.useMemo(
    () =>
      debounce(
        CONTENT_SERIALIZE_DEBOUNCE,
        (serializeEditorContent: () => string) => {
          updateChallenge({
            id: challenge.id,
            challenge: { supplementaryContent: serializeEditorContent() },
          });
        },
      ),
    [challenge.id],
  );

  const handleVideoUrl = (e: ChangeEvent<HTMLInputElement>) => {
    updateChallenge({
      id: challenge.id,
      challenge: {
        videoUrl: e.target.value,
      },
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
      {challenge.videoUrl && <YoutubeEmbed url={challenge.videoUrl} />}
      <Suspense fallback={<Loading />}>
        <ContentEditor
          toc={false /* Turn off so we can use our own */}
          plugins={[tableOfContents]}
          placeholder="Write something beautiful..."
          defaultValue={challenge.supplementaryContent}
          autoFocus={
            isEditMode &&
            !challenge.supplementaryContent /* Only focus an empty editor */
          }
          readOnly={!isEditMode}
          spellCheck={isEditMode}
          onChange={handleContent}
        />
      </Suspense>
      {isEditMode && (
        <Callout title="Video URL" style={{ marginBottom: 40, marginTop: 40 }}>
          <p>If this challenge has a video enter the embed URL here.</p>
          <input
            className={Classes.INPUT}
            style={{ width: "100%" }}
            type="url"
            onChange={handleVideoUrl}
            value={challenge.videoUrl}
          />
        </Callout>
      )}
      <div style={{ maxWidth: PROSE_MAX_WIDTH }}>
        <Hr style={{ marginTop: 40, marginBottom: 20 }} />
        <NextChallengeCard />
      </div>
    </SupplementaryContentContainer>
  );
});

export default MediaArea;

const Hr = styled.hr`
  border: 1px solid transparent;
  border-top-color: black;
  border-bottom-color: #353535;
`;

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
