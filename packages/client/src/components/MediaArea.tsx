import Modules, { ReduxStoreState } from "modules/root";
import { debounce } from "throttle-debounce";
import React, { ChangeEvent, Suspense } from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Loading, SmoothScrollButton } from "./Shared";
import { EditableText, Callout, Classes, Button } from "@blueprintjs/core";
import { NextChallengeCard } from "./ChallengeControls";
import {
  PROSE_MAX_WIDTH,
  CONTENT_SERIALIZE_DEBOUNCE,
  MOBILE,
  COLORS,
} from "tools/constants";
import { SlatePlugin } from "rich-markdown-editor";
import TableOfContents from "./TableOfContents";
import ContentEditor from "./ContentEditor";
import { Challenge } from "@pairwise/common";
import { isContentOnlyChallenge } from "tools/utils";
import toaster from "tools/toast-utils";

const VIDEO_DOM_ID = "pw-video-embed";

const CONTENT_AREA_ID = "supplementary-content-container";

const TableOfContentsPlugin = (): SlatePlugin => {
  const renderEditor: SlatePlugin["renderEditor"] = (_, editor, next) => {
    const children = next();
    const showToc = TableOfContents.getHeadings(editor).size > 1;

    return (
      <FlexWrap>
        <Flex>{children}</Flex>
        {showToc && (
          <FlexFixed>
            <TableOfContents editor={editor} />
          </FlexFixed>
        )}
      </FlexWrap>
    );
  };

  return { renderEditor };
};

// const

// NOTE: Overflow auto is necessary to prevent the child from overflowing... but
// it doesn't add scroll bars. It just does what we actually want which is add
// scroll bars to the elements that are too wide, but not the whole thing.
const Flex = styled.div`
  overflow: auto;
  width: 100%;
  max-width: ${PROSE_MAX_WIDTH}px;
`;

const FlexWrap = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;

  @media ${MOBILE} {
    flex-direction: column-reverse;
  }
`;

const FlexFixed = styled.div`
  position: relative;
  width: 300px;
  flex-grow: 0;
  flex-shrink: 0;
  margin-left: 4%;

  @media ${MOBILE} {
    margin-left: 0;
  }
`;

/**
 * The media area. Where supplementary content and challenge videos live. The
 * media area can also serve as the standalone UI for a challenge that is all
 * information, without any interactive coding practice.
 */

const MediaArea = ({
  challenge,
  title,
  isEditMode,
  updateChallenge,
}: MediaAreaProps) => {
  const handleTitle = (x: string) =>
    updateChallenge({ id: challenge.id, challenge: { title: x } });

  const tableOfContents = React.useMemo(() => TableOfContentsPlugin(), []);

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
            challenge: { content: serializeEditorContent() },
          });
        },
      ),
    [challenge.id, updateChallenge],
  );

  const handleVideoUrl = (e: ChangeEvent<HTMLInputElement>) => {
    const videoUrl = e.target.value;

    // Safety check to be sure the embed link is included!
    if (!videoUrl.includes("embed")) {
      toaster.warn("Be sure to use the embed url for the video link.");
    }

    updateChallenge({
      id: challenge.id,
      challenge: { videoUrl },
    });
  };

  return (
    <SupplementaryContentContainer id={CONTENT_AREA_ID}>
      <TitleHeader>
        <EditableText
          value={title}
          onChange={handleTitle}
          disabled={!isEditMode}
          multiline
        />
      </TitleHeader>
      {challenge.videoUrl && <YoutubeEmbed url={challenge.videoUrl} />}
      <Suspense fallback={<Loading />}>
        <ContentEditor
          toc={false /* Turn off so we can use our own */}
          plugins={[tableOfContents]}
          placeholder="Write something beautiful..."
          defaultValue={challenge.content}
          autoFocus={
            isEditMode && !challenge.content /* Only focus an empty editor */
          }
          readOnly={!isEditMode}
          spellCheck={isEditMode}
          onChange={handleContent}
        />
      </Suspense>
      {isEditMode && (
        <Callout
          title="Video URL"
          style={{ marginBottom: 46, marginTop: 46, maxWidth: PROSE_MAX_WIDTH }}
        >
          <p>
            If this challenge has a video enter the{" "}
            <Highlight>video embed URL</Highlight> here. From the video click
            "Share", "Embed" and grab the <code>src</code> link url.
          </p>
          <input
            type="url"
            className={Classes.INPUT}
            style={{ width: "100%" }}
            onChange={handleVideoUrl}
            value={challenge.videoUrl}
          />
          <p style={{ fontSize: 12, marginTop: 12 }}>
            <b>NOTE:</b> <code>?rel=0</code> will be appended to disable related
            videos.
          </p>
        </Callout>
      )}
      <div style={{ maxWidth: PROSE_MAX_WIDTH }}>
        <Hr style={{ marginTop: 40, marginBottom: 20 }} />
        <NextChallengeCard />
      </div>
      {!isContentOnlyChallenge(challenge) && (
        <SmoothScrollButton
          icon="chevron-up"
          position="top"
          positionOffset={40}
          scrollToId="root"
          backgroundColor="#242423"
        />
      )}
    </SupplementaryContentContainer>
  );
};

// This weirdness is just for type checking... the media area needs a firmly defined
// challenge otherwise the react hooks get angry that they are being called
// conditionally. The thing is, they depends on the challenge so they need the
// challenge to be defined
// NOTE: Maybe this logic could be a HOC someday.
const MediaAreaContainer = (props: MediaAreaContainerProps) => {
  if (!props.challenge) {
    return <Loading />;
  }

  return <MediaArea {...(props as MediaAreaProps)} />;
};

const mapStateToProps = (state: ReduxStoreState) => ({
  title: Modules.selectors.challenges.getCurrentTitle(state) || "",
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  isEditMode: Modules.selectors.challenges.isEditMode(state),
});

const dispatchProps = {
  updateChallenge: Modules.actions.challenges.updateChallenge,
};

type MediaAreaContainerProps = ReturnType<typeof mapStateToProps> &
  typeof dispatchProps;

interface MediaAreaProps extends MediaAreaContainerProps {
  challenge: NonNullable<Challenge>;
}

export default connect(mapStateToProps, dispatchProps)(MediaAreaContainer);

const Hr = styled.hr`
  border: 1px solid transparent;
  border-top-color: black;
  border-bottom-color: #353535;
`;

const SupplementaryContentContainer = styled.div`
  padding: 25px;
  background: #1e1e1e;
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;

  @media ${MOBILE} {
    padding-left: 12px;
    padding-right: 12px;
  }
`;

const TitleHeader = styled.h1`
  font-size: 3em;
`;

const Highlight = styled.mark`
  font-weight: bold;
  color: white;
  background: #ffdf7538;
  border-bottom: 2px solid #ffdf75;
`;

// NOTE: 16:9 aspect ratio. All our videos should be recorded at 1080p so this
// should not be a limitation. See this post for the logic on this aspect ratio CSS:
// https://css-tricks.com/NetMag/FluidWidthVideo/Article-FluidWidthVideo.php
const VideoWrapper = styled.div`
  position: relative;
  padding-bottom: 56.25%; /* See NOTE  */
  padding-top: 25px;
  height: 0;
  margin-bottom: 40px;
  border: 1px solid #444444;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 1px 15px rgba(0, 0, 0, 0.48);

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 100%;
  }
`;

// Get the origin param for embeds. Should be our site, but we also want embeds
// to run locally for developing and testing.
const getEmbedOrigin = () => {
  try {
    return window.location.origin;
  } catch (err) {
    return "https://app.pairwise.tech";
  }
};

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
  const [isEmbedHidden, setIsEmbedHidden] = React.useState<boolean>(
    Boolean(process.env.REACT_APP_HIDE_EMBEDS),
  );

  if (isEmbedHidden) {
    return (
      <VideoWrapper
        style={{
          width: "100%",
          height,
          paddingBottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 40,
          background: COLORS.BACKGROUND_CONTENT,
        }}
      >
        <h3 style={{ textTransform: "uppercase" }}>Embed Hidden</h3>
        <p>
          Restart the app without <code>REACT_APP_HIDE_EMBEDS</code> to avoid
          this.
        </p>
        <Button onClick={() => setIsEmbedHidden(false)}>Show Anyway</Button>
      </VideoWrapper>
    );
  }

  const parsedURL = new URL(props.url);

  // Use ?rel=0 to disable related videos in youtube embeds. Supposedly shouldn't work, but it seems to: https://developers.google.com/youtube/player_parameters#rel
  parsedURL.searchParams.set("rel", "0");
  parsedURL.searchParams.set("modestbranding", "1");

  // Allow programmatic control
  parsedURL.searchParams.set("enablejsapi", "1");
  parsedURL.searchParams.set("origin", getEmbedOrigin());

  return (
    <VideoWrapper>
      <iframe
        id={VIDEO_DOM_ID}
        title="Youtube Embed"
        width={width}
        height={height}
        src={parsedURL.href}
        frameBorder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </VideoWrapper>
  );
};

export const scrollToContentArea = () => {
  const el = document.getElementById(CONTENT_AREA_ID);

  if (!el) {
    throw new Error("No content area element found");
  }

  el.scrollIntoView({ behavior: "smooth" });
};

export const scrollToVideoAndPlay = () => {
  // @ts-ignore Seems that get element by ID cannot be passed the type of dom node it expects
  const el: Nullable<HTMLIFrameElement> = document.getElementById(VIDEO_DOM_ID);

  if (!el) {
    throw new Error("No video element found");
  }

  // Should this be an error? It's a transient issue assuming it really is the iframe not yet loaded.
  if (!el.contentWindow) {
    console.warn(
      "No content window found. This usually means the iframe has not finished loading yet.",
    );
    return;
  }

  const PLAY_COMMAND = JSON.stringify({ event: "command", func: "playVideo" });

  el.scrollIntoView({ behavior: "smooth" });

  // Reverse engineered the postMessage call to play the vid without external
  // SDK. This is... unecessary. We could just use youtube's YT.js, however I
  // really didn't want to include an external lib just to make this play. Yes,
  // I'm being silly but my silliness lead me to the post message call they use
  // internally to play. Anyway, here we are.
  el.contentWindow.postMessage(PLAY_COMMAND, "https://www.youtube.com");
};
