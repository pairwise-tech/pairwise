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
  Collapse,
  Callout,
  PopoverInteractionKind,
  PopoverPosition,
} from "@blueprintjs/core";
import { SANDBOX_ID } from "tools/constants";
import { ChallengeTypeOption } from "./ChallengeTypeMenu";
import KeyboardShortcuts from "./KeyboardShortcuts";
import {
  CHALLENGE_TYPE,
  Challenge,
  ChallengeMetadataIndex,
  ChallengeMetadata,
} from "@pairwise/common";
import { withRouter, RouteComponentProps } from "react-router-dom";
import pipe from "ramda/es/pipe";
import { generateEmptyChallenge } from "tools/utils";
import { IconButton } from "./Shared";

const CONTRIBUTOR_IMAGES = {
  "Ian Sinnott": require("./img/ian.jpg").default,
  "Sean Smith": require("./img/sean.png").default,
  "Peter Weinberg": require("./img/pete.jpg").default,
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
  rust: "Rust",
  python: "Python",
  golang: "Golang",
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
    isDirty,
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
        <Button
          large
          minimal
          icon="saved"
          disabled={!isDirty}
          onClick={handleSave}
          intent={isDirty ? "primary" : "none"}
        />
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
            onItemSelect={(x) => {
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
  course: Modules.selectors.challenges.getCurrentCourseSkeleton(state),
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
  if (!state.module || !state.isEditMode || !state.course) {
    return {
      isEditMode: state.isEditMode,
      insertPrevChallenge: () => console.warn("Called outside of edit mode."),
      insertNextChallenge: () => console.warn("Called outside of edit mode."),
    };
  }

  const courseId = state.course.id;
  const moduleId = state.module.id;
  const newChallenge = generateEmptyChallenge({ id: state.course.id });
  const index = state.module.challenges.findIndex(
    (x) => x.id === state.challengeId,
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
  const [allMetadata, setAllMetadata] =
    React.useState<ChallengeMetadataIndex | null>(null);
  const [error, setError] = React.useState(false);
  const [isGitInfoOpen, setIsGitInfoOpen] = React.useState(false);
  const handleToggleGitInfo = () => setIsGitInfoOpen(!isGitInfoOpen);

  const handleClick = React.useCallback(() => {
    import("@pairwise/common/src/courses/metadata.json")
      .then(({ default: x }) => {
        // @ts-ignore
        setAllMetadata(x as ChallengeMetadataIndex);
      })
      .catch((err) => {
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
  } else if (!allMetadata || !(challenge.id in allMetadata.challenges)) {
    content = <Spinner />;
  } else {
    const meta = allMetadata.challenges[challenge.id];
    const { contributors, contributionsBy, latestUpdate, earliestUpdate } =
      meta.gitMetadata;
    const dateString = dateFromIso(latestUpdate.authorDate);
    content = (
      <>
        <h3 style={{ display: "flex", alignItems: "center", marginTop: 0 }}>
          <span style={{ marginRight: 20 }}>Contributors</span>
          {contributors.map((name) => (
            <ContributorAvatar
              key={name}
              name={name}
              contributions={contributionsBy[name]}
            />
          ))}
        </h3>
        <div style={{ marginBottom: 10 }}>
          Last updated by <strong>{latestUpdate.author}</strong> on{" "}
          <em>{dateString}</em>.
        </div>
        <div style={{ marginBottom: 10 }}>
          <ButtonGroup>
            <CommitDetailButton
              label="Earliest Known Commit"
              {...earliestUpdate}
            />
            <CommitDetailButton label="Latest Known Commit" {...latestUpdate} />
          </ButtonGroup>
        </div>
        <Button
          style={{ width: "100%" }}
          icon={isGitInfoOpen ? "caret-down" : "caret-right"}
          minimal
          onClick={handleToggleGitInfo}
        >
          About this information
        </Button>
        <Collapse isOpen={isGitInfoOpen}>
          <Callout>
            <p>
              Known commits are not guaranteed to be accurate. Correcting a typo
              for example will make you the author of the entirety of a course
              line.
            </p>
            <p>
              However, git is fairly advanced. Commits where lines can be
              detected to be copy-pasted are not included so moving lines around
              in the course file should not overwrite existing authorship in
              this view. This does mean though that the latest linked here
              commit may well not be the literal latest commit you can find for
              the given block of JSON that makes up this challenge.
            </p>
          </Callout>
        </Collapse>
      </>
    );
  }

  return (
    <Popover
      canEscapeKeyClose
      position={Position.BOTTOM}
      content={<Card style={{ maxWidth: 350 }}>{content}</Card>}
    >
      <IconButton onClick={handleClick} large minimal icon="git-branch" />
    </Popover>
  );
};

const dateFromIso = (s: string) => {
  return s.split("T")[0];
};

const MinimalCard = styled(Card)`
  background-color: #222 !important;
  padding: 5px 10px;
  color: white;

  h3 {
    margin: 0;
    margin-bottom: 5px;
  }
  p {
    margin: 0;
  }
`;

type GitUpdate = ChallengeMetadata["gitMetadata"]["earliestUpdate"] & {
  label: string;
};

const CommitDetailButton = ({ label, ...update }: GitUpdate) => {
  return (
    <Popover
      minimal
      interactionKind={PopoverInteractionKind.HOVER}
      position={PopoverPosition.BOTTOM}
      hoverOpenDelay={200}
      hoverCloseDelay={0}
      usePortal={false}
    >
      <AnchorButton
        target="_blank"
        href={`https://github.com/pairwise-tech/pairwise/commit/${update.commit}`}
      >
        {label}
      </AnchorButton>
      <MinimalCard>
        <h3>
          <em>{dateFromIso(update.authorDate)}</em>
          <span style={{ opacity: 0.5 }}>{" • "}</span>
          <a
            style={{ fontFamily: "monospace", color: "#1AB6FF" }}
            target="_blank"
            rel="noopener noreferrer"
            href={`https://github.com/pairwise-tech/pairwise/commit/${update.commit}`}
          >
            {update.commit}
          </a>
          <span style={{ opacity: 0.5 }}>{" • "}</span>
          {update.author}
        </h3>
        <p></p>
        <p>{update.summary}</p>
      </MinimalCard>
    </Popover>
  );
};

interface ContributorAvatarProps {
  name: string;
  contributions: string[];
}

// NOTE: The need for state here is because of super finnicky Blueprint
// popovers. The commits popover was opening up whenever the parent popover
// opened. This is not at all what we want. So I created a boolean that only
// becomes true whent he img element is hovered. What makes this quite wierd
// though is that being true doesn't mean its open, it just means it can use its
// own open/clsoe logic. This is because handling over state manually is tricky.
// It's easy for the mouse leave / mouse out event not to fire (i'm guessing its
// debounced somewhere behind the scense) thus leaving your hover popout open
// without a means to close it except to rehover and slowly move the mouse out.
const ContributorAvatar = ({ name, contributions }: ContributorAvatarProps) => {
  const [canOpen, setCanOpen] = React.useState(false);
  return (
    <Popover
      minimal
      interactionKind={PopoverInteractionKind.HOVER}
      position={PopoverPosition.BOTTOM}
      hoverOpenDelay={30}
      hoverCloseDelay={0}
      usePortal={false}
      defaultIsOpen={false}
      enforceFocus={false}
      isOpen={canOpen ? undefined : false} // See NOTE
      onClose={() => setCanOpen(false)}
    >
      <img
        onMouseOver={() => setCanOpen(true)}
        style={{
          width: 30,
          height: 30,
          borderRadius: 30,
          marginLeft: 10,
        }}
        key={name}
        // @ts-ignore Just shut up TS. If the name is not found that's fine
        src={CONTRIBUTOR_IMAGES[name]}
        alt={name}
      />
      <MinimalCard>
        {contributions.map((commit) => (
          <a
            style={{
              display: "block",
              fontFamily: "monospace",
              color: "#1AB6FF",
            }}
            key={commit}
            target="_blank"
            rel="noopener noreferrer"
            href={`https://github.com/pairwise-tech/pairwise/commit/${commit}`}
          >
            {commit}
          </a>
        ))}
      </MinimalCard>
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
  opacity: ${(props) => (props.show ? 1 : 0)};
  pointer-events: ${(props) => (props.show ? "all" : "none")};
  transform: ${(props) => (props.show ? "translateX(0)" : "translateX(-10px)")};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapToolbarState = (state: ReduxStoreState) => ({
  isEditMode: Modules.selectors.challenges.isEditMode(state),
  isDirty: Modules.selectors.challenges.isDirty(state),
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
