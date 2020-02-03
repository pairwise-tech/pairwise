import Modules, { ReduxStoreState } from "modules/root";
import React, { ChangeEvent } from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { ContentInput, StyledMarkdown } from "./Shared";
import { EditableText, Callout, Classes } from "@blueprintjs/core";
import { NextChallengeCard } from "./ChallengeControls";
import { PROSE_MAX_WIDTH } from "tools/constants";
import {
  createEditor,
  Editor,
  Transforms,
  Range,
  Point,
  Node as SlateNode,
} from "slate";
import {
  Slate,
  Editable,
  withReact,
  ReactEditor,
  RenderElementProps,
} from "slate-react";
import pipe from "ramda/es/pipe";

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

const CodeElement = (props: RenderElementProps) => {
  return (
    <pre style={{ border: "1px solid red" }} {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  );
};

const Element = (props: RenderElementProps) => {
  const { attributes, children, element } = props;

  switch (element.type) {
    case "block-quote":
      return <blockquote {...attributes}>{children}</blockquote>;
    case "bulleted-list":
      return <ul {...attributes}>{children}</ul>;
    case "heading-one":
      return <h1 {...attributes}>{children}</h1>;
    case "heading-two":
      return <h2 {...attributes}>{children}</h2>;
    case "heading-three":
      return <h3 {...attributes}>{children}</h3>;
    case "heading-four":
      return <h4 {...attributes}>{children}</h4>;
    case "heading-five":
      return <h5 {...attributes}>{children}</h5>;
    case "heading-six":
      return <h6 {...attributes}>{children}</h6>;
    case "list-item":
      return <li {...attributes}>{children}</li>;
    case "horizontal-rule":
      return <hr {...attributes} />;
    case "code":
    case "code-js":
    case "code-javascript":
    case "code-ts":
    case "code-typescript":
    case "code-html":
    case "code-css": {
      // TODO: Use this code type to inform syntax highlighting
      const codeType = element.type.split("-")[1] || "text";
      console.warn(`[INFO] Got code type of "${codeType}"`);
      return <CodeElement {...props} />;
    }
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const SHORTCUTS: { [k: string]: string } = {
  "*": "list-item",
  "-": "list-item",
  "+": "list-item",
  ">": "block-quote",
  "#": "heading-one",
  "##": "heading-two",
  "###": "heading-three",
  "####": "heading-four",
  "#####": "heading-five",
  "######": "heading-six",
  "```": "code",
  "```js": "code-javascript",
  "```javascript": "code-javascript",
  "```ts": "code-typescript",
  "```typescript": "code-typescript",
  "```html": "code-html",
  "```css": "code-css",
};
const withRichMarkdown = (editor: ReactEditor) => {
  const { deleteBackward, insertText } = editor;

  editor.insertText = text => {
    const { selection } = editor;

    if (text === " " && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection;
      const block = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
      });
      const path = block ? block[1] : [];
      const start = Editor.start(editor, path);
      const range = { anchor, focus: start };
      const beforeText = Editor.string(editor, range);
      const type = SHORTCUTS[beforeText];

      if (type) {
        Transforms.select(editor, range);
        Transforms.delete(editor);
        Transforms.setNodes(
          editor,
          { type },
          { match: n => Editor.isBlock(editor, n) },
        );

        if (type === "list-item") {
          const list = { type: "bulleted-list", children: [] };
          Transforms.wrapNodes(editor, list, {
            match: n => n.type === "list-item",
          });
        }

        return;
      }
    }

    insertText(text);
  };

  editor.deleteBackward = (...args) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
      });

      if (match) {
        const [block, path] = match;
        const start = Editor.start(editor, path);

        if (
          block.type !== "paragraph" &&
          Point.equals(selection.anchor, start)
        ) {
          Transforms.setNodes(editor, { type: "paragraph" });

          if (block.type === "list-item") {
            Transforms.unwrapNodes(editor, {
              match: n => n.type === "bulleted-list",
            });
          }

          return;
        }
      }

      deleteBackward(...args);
    }
  };

  return editor;
};

const enhanceEditor: (e: Editor) => ReactEditor = pipe(
  withReact,
  withRichMarkdown,
);

const MediaArea = connect(
  mapStateToProps,
  dispatchProps,
)(({ challenge, title, isEditMode, updateChallenge }: MediaAreaProps) => {
  const editor = React.useMemo(() => enhanceEditor(createEditor()), []);
  const [value, setValue] = React.useState<SlateNode[]>([
    {
      type: "paragraph",
      children: [{ text: "" }],
    },
  ]);
  const renderElement = React.useCallback(
    (props: RenderElementProps) => <Element {...props} />,
    [],
  );

  if (!challenge) {
    return <h1>Loading...</h1>;
  }

  const handleTitle = (x: string) =>
    updateChallenge({ id: challenge.id, challenge: { title: x } });

  const handleContent = (supplementaryContent: string) => {
    updateChallenge({
      id: challenge.id,
      challenge: { supplementaryContent },
    });
  };

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
      <Slate editor={editor} value={value} onChange={setValue}>
        <Editable renderElement={renderElement} />
      </Slate>
      {isEditMode ? (
        <ContentInput
          value={challenge.supplementaryContent}
          onChange={handleContent}
        />
      ) : (
        <StyledMarkdown source={challenge.supplementaryContent} />
      )}
      {isEditMode && (
        <Callout title="Video URL" style={{ marginBottom: 40 }}>
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

const Hr = styled.hr`
  border: 1px solid transparent;
  border-top-color: black;
  border-bottom-color: #353535;
`;

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
