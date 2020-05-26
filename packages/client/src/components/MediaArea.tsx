import Modules, { ReduxStoreState } from "modules/root";
import { debounce } from "throttle-debounce";
import React, { ChangeEvent, Suspense } from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import {
  Loading,
  SmoothScrollButton,
  SupplementaryContentContainer,
  TitleHeader,
  Highlight,
  Hr,
  DefaultVideoWrapper,
  VideoWrapper,
} from "./Shared";
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
import { HIDE_EMBEDS } from "tools/client-env";

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

  const extractVideoId = (s: string) => {
    const rs: Array<(x: string) => string | undefined | null> = [
      x => x.match(/https:\/\/www.youtube.com\/embed\/(.+)\/?/)?.[1],
      x => x.match(/https:\/\/youtu.be\/(.+)\/?/)?.[1],
      x => new URL(x).searchParams.get("v"),
    ];

    const results = rs.map(fn => {
      try {
        return fn(s);
      } catch (err) {
        return null;
      }
    });

    return results.find(Boolean);
  };

  const handleVideoUrl = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const videoId = extractVideoId(input);
    const videoUrl = `https://www.youtube.com/embed/${videoId}`;

    // Safety check to be sure the embed link is included!
    if (!videoId && input) {
      toaster.warn(`
All URLS will be converted to this format: https://www.youtube.com/embed/\${ID}

Valid entry formats:
https://www.youtube.com/embed/\${ID} (embed URL)
https://www.youtube.com/watch?v=\${ID} (long URL)
https://youtu.be/\${ID} (short URL)
ID (video ID)
      `);
    }

    if (input && videoUrl !== input) {
      toaster.success(`Video ID (${videoId}) formatted into embed URL.`);
    }

    updateChallenge({
      id: challenge.id,
      challenge: { videoUrl: input ? videoUrl : "" },
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
export const YoutubeEmbed = (props: { url: string }) => {
  const width = 728;
  const height = 410;

  const [isEmbedHidden, setIsEmbedHidden] = React.useState<boolean>(
    HIDE_EMBEDS,
  );

  if (isEmbedHidden) {
    return (
      <DefaultVideoWrapper>
        <h3 style={{ textTransform: "uppercase" }}>Embed Hidden</h3>
        <p>
          Restart the app with <code>REACT_APP_HIDE_EMBEDS=false</code> to show
          all embeds by default.
        </p>
        <Button onClick={() => setIsEmbedHidden(false)}>Show Anyway</Button>
      </DefaultVideoWrapper>
    );
  }

  try {
    // Will throw if the url is invalid (shouldn't happen, but it will crash the app)
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
  } catch (err) {
    return null;
  }
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
