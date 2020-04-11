import Modules, { ReduxStoreState } from "modules/root";
import React, { Suspense } from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import {
  Switch,
  Button,
  Tooltip,
  Position,
  ButtonGroup,
  Popover,
  AnchorButton,
  Spinner,
  Card,
} from "@blueprintjs/core";
import { SANDBOX_ID } from "tools/constants";
import { ChallengeTypeOption } from "./ChallengeTypeMenu";
import KeyboardShortcuts from "./KeyboardShortcuts";
import {
  CHALLENGE_TYPE,
  Challenge,
  ChallengeMetadataIndex,
} from "@pairwise/common";
import { withRouter, RouteComponentProps } from "react-router-dom";
import pipe from "ramda/es/pipe";
import { generateEmptyChallenge } from "tools/utils";
import { IconButton } from "./Shared";

const CONTRIBUTOR_IMAGES = {
  "Ian Sinnott": require("./img/ian.jpg"),
  "Sean Smith": require("./img/sean.png"),
  "Peter Weinberg": require("./img/pete.jpg"),
};

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const LazyChallengeTypeMenu = React.lazy(() => import("./ChallengeTypeMenu"));

type EditChallengeControlsConnectProps = ReturnType<typeof mapToolbarState> &
  typeof toolbarDispatchProps;

type ChallengeTypeChoiceMap = { [key in CHALLENGE_TYPE]: string };

/**
 * Map of challenge types to choice labels.
 */
const challengeTypeChoiceMap: ChallengeTypeChoiceMap = {
  section: "Section",
  media: "Media",
  markup: "Markup",
  typescript: "TypeScript",
  react: "React",
  project: "Project",
  "guided-project": "Guided Project",
  "special-topic": "Special Topic",
};

const mapChallengeTypeEntries = (
  entry: [string, string],
): ChallengeTypeOption => {
  const [key, label] = entry;
  return {
    value: key as CHALLENGE_TYPE /* Screw you TypeScript! */,
    label,
  };
};

/**
 * Turn the well-typed challenge type choice map into a list of options
 * without elegance.
 */
const CHALLENGE_TYPE_CHOICES = Object.entries(challengeTypeChoiceMap).map(
  mapChallengeTypeEntries,
);

/** ===========================================================================
 * React Component
 * ============================================================================
 */

const EditingToolbar = (props: EditChallengeControlsConnectProps) => {
  // For hiding the controls while recording a video.
  const [hidden, setHidden] = React.useState(false);
  const {
    course,
    challenge,
    activeIds,
    isEditMode,
    setEditMode,
    saveCourse,
    overlayVisible,
  } = props;

  const { currentCourseId, currentModuleId, currentChallengeId } = activeIds;

  const canDelete = currentCourseId && currentModuleId && currentChallengeId;

  if (challenge?.id === SANDBOX_ID) {
    // The sandbox is meant to be just that, and cannot be edited in the same
    // way the course challenges can be
    return null;
  }

  const toggleHidden = () => {
    setHidden(!hidden);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditMode(event.target.checked);
  };

  const handleSave = () => {
    if (course) {
      saveCourse(course);
    } else {
      console.warn("No course to save!!! WHAT??");
    }
  };

  const handleDelete = () => {
    if (!currentCourseId || !currentModuleId || !currentChallengeId) {
      console.warn("No course, module, or challenge id to delete !!! ¿¿¿");
    } else {
      props.deleteChallenge({
        courseId: currentCourseId,
        moduleId: currentModuleId,
        challengeId: currentChallengeId,
      });
    }
  };

  // NOTE: I'm defaulting the challenge id to an empty string simply to get past ts errors.
  return (
    <div
      style={{
        display: hidden ? "none" : "flex",
        alignItems: "center",
        top: 0,
        left: 0,
      }}
    >
      <Switch
        style={{
          marginBottom: 0,
          marginRight: 10,
        }}
        checked={isEditMode}
        onChange={handleChange}
        large
        labelElement={"Edit"}
      />
      <SlideOut show={isEditMode && !hidden}>
        <ChallengeInsertionMenu />
        {challenge && <GitContributionInfo challenge={challenge} />}
        <Tooltip content="Save" position={Position.BOTTOM}>
          <Button
            icon="saved"
            large
            minimal
            intent="primary"
            onClick={handleSave}
          ></Button>
        </Tooltip>
        {canDelete && (
          <Tooltip content="Delete" position={Position.BOTTOM}>
            <Button
              intent="danger"
              icon="trash"
              large
              minimal
              onClick={handleDelete}
              disabled={overlayVisible}
            ></Button>
          </Tooltip>
        )}
        <Suspense fallback={<p>Menu Loading...</p>}>
          <LazyChallengeTypeMenu
            tooltip={false}
            items={CHALLENGE_TYPE_CHOICES}
            currentChallengeType={challenge?.type}
            onItemSelect={x => {
              props.updateChallenge({
                id: challenge?.id || "", // See NOTE
                challenge: { type: x.value },
              });
            }}
          />
        </Suspense>
      </SlideOut>
      <KeyboardShortcuts keymap={{ "cmd+shift+e": toggleHidden }} />
    </div>
  );
};

const mapInsertionMenuState = (state: ReduxStoreState) => ({
  isEditMode: Modules.selectors.challenges.isEditMode(state),
  module: Modules.selectors.challenges.getCurrentModule(state),
  courseId: Modules.selectors.challenges.getCurrentCourseSkeleton(state)?.id,
  challengeId: Modules.selectors.challenges.getCurrentChallengeId(state),
});

const insertionMenuDispatchProps = {
  createChallenge: Modules.actions.challenges.createChallenge,
};

const mergeInsertionMenuProps = (
  state: ReturnType<typeof mapInsertionMenuState>,
  methods: typeof insertionMenuDispatchProps,
  props: RouteComponentProps,
) => {
  if (!state.module || !state.isEditMode || !state.courseId) {
    return {
      isEditMode: state.isEditMode,
      insertPrevChallenge: () => console.warn("Called outside of edit mode."),
      insertNextChallenge: () => console.warn("Called outside of edit mode."),
    };
  }

  const courseId = state.courseId;
  const moduleId = state.module.id;
  const newChallenge = generateEmptyChallenge();
  const index = state.module.challenges.findIndex(
    x => x.id === state.challengeId,
  );

  return {
    isEditMode: state.isEditMode,
    insertPrevChallenge: () => {
      methods.createChallenge({
        courseId,
        moduleId,
        insertionIndex: index, // NOTE: Inserting _at the current index_ will put the new challenge before this current one
        challenge: newChallenge,
      });
      props.history.push(`/workspace/${newChallenge.id}`);
    },
    insertNextChallenge: () => {
      methods.createChallenge({
        courseId,
        moduleId,
        insertionIndex: index + 1,
        challenge: newChallenge,
      });
      props.history.push(`/workspace/${newChallenge.id}`);
    },
  };
};

type ChallengeInsertionProps = ReturnType<typeof mergeInsertionMenuProps> &
  RouteComponentProps;

const connectChallengeInsertion = pipe(
  connect(
    mapInsertionMenuState,
    insertionMenuDispatchProps,
    mergeInsertionMenuProps,
  ),
  withRouter,
);

const ChallengeInsertionMenu = connectChallengeInsertion(
  (props: ChallengeInsertionProps) => {
    return (
      <Popover
        canEscapeKeyClose
        position={Position.BOTTOM}
        content={
          <div>
            <ButtonGroup>
              <Button onClick={props.insertPrevChallenge}>Insert Before</Button>
              <Button onClick={props.insertNextChallenge}>Insert After</Button>
            </ButtonGroup>
          </div>
        }
      >
        <IconButton large minimal icon="add-to-artifact" />
      </Popover>
    );
  },
);

const GitContributionInfo = ({ challenge }: { challenge: Challenge }) => {
  const [metadata, setMetadata] = React.useState<ChallengeMetadataIndex | null>(
    null,
  );
  const [error, setError] = React.useState(false);

  const handleClick = React.useCallback(() => {
    import("@pairwise/common/src/courses/metadata.json")
      .then(({ default: x }) => {
        // @ts-ignore
        setMetadata(x as ChallengeMetadataIndex);
      })
      .catch(err => {
        setError(true);
      });
  }, []);

  let content;
  if (error) {
    content = (
      <>
        <h1>Error</h1>
        <p>
          Could not load metadata for current challenge. This probably just
          means the metadata index hasn't been rebuilt after recent course
          udpates.
        </p>
      </>
    );
  } else if (!metadata || !(challenge.id in metadata)) {
    content = <Spinner />;
  } else {
    const meta = metadata[challenge.id];
    const { authors, latestUpdate } = meta.gitMetadata;
    const { commit, author, authorDate } = latestUpdate;
    const dateString = authorDate.split("T")[0];
    content = (
      <>
        <h3 style={{ display: "flex", alignItems: "center", marginTop: 0 }}>
          <span style={{ marginRight: 20 }}>Authors</span>
          {authors.map(name => (
            <img
              style={{
                width: 30,
                height: 30,
                borderRadius: 30,
                marginLeft: 10,
              }}
              key={name}
              // @ts-ignore Just shut up TS.If the name is not found that's fine
              src={CONTRIBUTOR_IMAGES[name]}
              alt={name}
            />
          ))}
        </h3>
        <div>
          Last updated by <strong>{author}</strong> on <em>{dateString}</em>.
        </div>
        <AnchorButton
          style={{ width: "100%" }}
          target="_blank"
          href={`https://github.com/pairwise-tech/pairwise/commit/${commit}`}
        >
          View Latest Commit
        </AnchorButton>
      </>
    );
  }

  return (
    <Popover
      canEscapeKeyClose
      position={Position.BOTTOM}
      content={<Card>{content}</Card>}
    >
      <IconButton onClick={handleClick} large minimal icon="git-branch" />
    </Popover>
  );
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const SlideOut = styled.div<{ show: boolean }>`
  display: flex;
  align-items: center;
  transition: all 0.2s ease-out;
  opacity: ${props => (props.show ? 1 : 0)};
  pointer-events: ${props => (props.show ? "all" : "none")};
  transform: ${props => (props.show ? "translateX(0)" : "translateX(-10px)")};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapToolbarState = (state: ReduxStoreState) => ({
  isEditMode: Modules.selectors.challenges.isEditMode(state),
  course: Modules.selectors.challenges.getCurrentCourse(state),
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  activeIds: Modules.selectors.challenges.getCurrentActiveIds(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
});

const toolbarDispatchProps = {
  setEditMode: Modules.actions.challenges.setEditMode,
  saveCourse: Modules.actions.challenges.saveCourse,
  updateChallenge: Modules.actions.challenges.updateChallenge,
  deleteChallenge: Modules.actions.challenges.deleteChallenge,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default connect(mapToolbarState, toolbarDispatchProps)(EditingToolbar);
