import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { SortEnd, SortableHandle } from "react-sortable-hoc";
import {
  ChallengeSkeleton,
  CourseSkeleton,
  ModuleSkeleton,
  Challenge,
  ChallengeSkeletonList,
  ModuleSkeletonList,
} from "@pairwise/common";
import Modules, { ReduxStoreState } from "modules/root";
import { COLORS, SANDBOX_ID } from "tools/constants";
import { HEADER_HEIGHT } from "tools/dimensions";
import {
  composeWithProps,
  generateEmptyModule,
  generateEmptyChallenge,
  getChallengeIcon,
  partitionChallengesBySection,
} from "tools/utils";
import {
  Tooltip,
  Icon,
  Collapse,
  Popover,
  Menu,
  MenuItem,
  Position,
  Button,
} from "@blueprintjs/core";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { NavLink, NavLinkProps } from "react-router-dom";
import {
  SortableModuleList,
  SortableChallengeList,
  ModuleNumber,
  ModuleNavigationBase,
} from "./NavigationOverlayComponents";

/** ===========================================================================
 * React Class
 * ============================================================================
 */

class NavigationOverlay extends React.Component<IProps> {
  componentDidMount() {
    this.lockWindowScrolling();
  }

  // Don't re-render when the nav is not open
  shouldComponentUpdate(nextProps: IProps) {
    return this.props.overlayVisible || nextProps.overlayVisible;
  }

  componentDidUpdate() {
    this.lockWindowScrolling();
  }

  lockWindowScrolling = () => {
    if (this.props.overlayVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "visible";
    }
  };

  render(): Nullable<JSX.Element> {
    const { course, module, overlayVisible } = this.props;

    if (!course || !module) {
      console.warn("[WARN] No module or course found! ->", course, module);
      return null;
    }

    const sectionIds = module.challenges
      .filter(x => x.type === "section")
      .map(x => x.id);
    const hasSections = sectionIds.length > 0;
    const anySectionsOpen =
      hasSections && sectionIds.some(this.getCurrentAccordionViewState);

    return (
      <Overlay visible={overlayVisible} onClick={this.handleClose}>
        <KeyboardShortcuts
          keymap={{
            // TODO: Add some UI to display what key shortcuts are available:
            escape: this.handleClose,
            "cmd+shift+k": this.navigateToSandBox,
            "cmd+j": this.handleToggleNavigationMap,
            "cmd+,": this.navigateLeft,
            "cmd+.": this.navigateRight,
            "cmd+;": this.props.toggleEditorSize,
          }}
        />
        <Col
          offsetX={overlayVisible ? 0 : -20}
          style={{ zIndex: 3, boxShadow: "rgba(0,0,0,0.22) 10px 0px 10px 0px" }}
          onClick={e => e.stopPropagation()}
        >
          <Title>{course.title}</Title>
          <ScrollableContent>
            {/* In case of no challenges yet, or to add one at the start, here's a button */}
            <div style={{ position: "relative" }}>
              {this.renderModuleCodepressButton(course, -1)}
            </div>
            {this.renderSortableModuleList(course, module, course.modules)}
          </ScrollableContent>
        </Col>
        <Col
          offsetX={overlayVisible ? 0 : -60}
          style={{
            width: 600,
            zIndex: 2,
          }}
          onClick={e => e.stopPropagation()}
        >
          <Title>
            <p>{module.title}</p>
            {hasSections && (
              <div>
                <Button onClick={this.toggleExpandCollapseAll}>
                  {anySectionsOpen ? "Collapse" : "Expand"} All Sections
                </Button>
              </div>
            )}
          </Title>
          <ScrollableContent>
            {/* In case of no challenges yet, or to add one at the start, here's a button */}
            {this.renderChallengeCodepressButton(course, module, -1)}
            {this.renderSortableChallengeList(
              course,
              module,
              module.challenges,
            )}
            <DoneScrolling />
          </ScrollableContent>
        </Col>
      </Overlay>
    );
  }

  renderSortableModuleList = (
    course: CourseSkeleton,
    module: ModuleSkeleton,
    moduleList: ModuleSkeletonList,
  ) => {
    const { isEditMode, updateCourseModule } = this.props;

    const handleDeleteModule = (moduleId: string) => {
      this.props.deleteCourseModule({ id: moduleId, courseId: course.id });
    };

    if (!isEditMode) {
      return moduleList.map((m, i) => {
        return this.renderModuleNavigationItem(module.id, m, i);
      });
    }

    return (
      <SortableModuleList
        useDragHandle
        items={moduleList}
        itemValueProps={{
          course,
          isEditMode,
          updateCourseModule,
          handleDeleteModule,
          currentActiveModule: module,
          renderModuleNavigationItem: this.renderModuleNavigationItem,
          renderModuleCodepressButton: this.renderModuleCodepressButton,
        }}
        helperClass="sortable-list-helper-class" /* Used to fix a z-index issue which caused the dragging element to be invisible */
        onSortEnd={sortEndResult =>
          this.handleSortModulesEnd(course, sortEndResult)
        }
      />
    );
  };

  handleSortModulesEnd = (course: CourseSkeleton, sortEndResult: SortEnd) => {
    this.props.reorderModuleList({
      courseId: course.id,
      moduleOldIndex: sortEndResult.oldIndex,
      moduleNewIndex: sortEndResult.newIndex,
    });
  };

  renderSortableChallengeList = (
    course: CourseSkeleton,
    module: ModuleSkeleton,
    challengeList: ChallengeSkeletonList,
  ) => {
    const { isEditMode } = this.props;

    /* Render the normal list: */
    if (!isEditMode) {
      return this.renderNormalChallengeList(course, module, challengeList);
    }

    /* Render the sortable list: */
    return (
      <SortableChallengeList
        useDragHandle
        items={challengeList}
        itemValueProps={{
          isEditMode,
          course,
          module,
          deleteChallenge: this.props.deleteChallenge,
          renderChallengeNavigationItem: this.renderChallengeNavigationItem,
        }}
        helperClass="sortable-list-helper-class" /* Used to fix a z-index issue which caused the dragging element to be invisible */
        onSortEnd={sortEndResult =>
          this.handleSortChallengesEnd(course, module, sortEndResult)
        }
      />
    );
  };

  // This can be used to expand or collapse all sections in the current module.
  toggleExpandCollapseAll = () => {
    const challengeList = this.props.module?.challenges;

    if (!challengeList) {
      return;
    }

    const sectionIds = challengeList
      .filter(({ type }) => type === "section")
      .map(x => x.id);
    const anyOpen = sectionIds.some(this.getCurrentAccordionViewState);

    // Go through each section and expand or collapse it.
    sectionIds
      .map(id => ({ sectionId: id, open: !anyOpen }))
      .forEach(this.props.toggleSectionAccordionView);
  };

  toggleExpandCollapse = (challenge: ChallengeSkeleton) => {
    const isSectionOpen = this.getCurrentAccordionViewState(challenge.id);
    this.props.toggleSectionAccordionView({
      sectionId: challenge.id,
      open: !isSectionOpen,
    });
  };

  renderNormalChallengeList = (
    course: CourseSkeleton,
    module: ModuleSkeleton,
    challengeList: ChallengeSkeletonList,
  ) => {
    /**
     * Partition the challenge list by sections.
     */
    const sectionBlocks = partitionChallengesBySection(challengeList);

    /**
     * Render the section blocks:
     */
    return sectionBlocks.map((block, blockIndex) => {
      if (block.section) {
        return (
          <div key={blockIndex}>
            {this.renderChallengeNavigationItem({
              module,
              course,
              isSection: true,
              sectionChallengeCount: block.challenges.length,
              sectionChallenges: block.challenges,
              index: blockIndex,
              challenge: block.section,
            })}
            <Collapse
              isOpen={this.getCurrentAccordionViewState(block.section.id)}
            >
              {block.challenges.map(
                (challenge: ChallengeSkeleton, index: number) => {
                  // @NOTE This is meant to be the index of the challenge as indexed in the full flattened list
                  const serialIndex = blockIndex + index + 1;
                  return this.renderChallengeNavigationItem({
                    index: serialIndex,
                    course,
                    module,
                    challenge,
                    style: { marginLeft: 20 },
                  });
                },
              )}
            </Collapse>
          </div>
        );
      } else {
        return block.challenges.map(
          (challenge: ChallengeSkeleton, index: number) => {
            return this.renderChallengeNavigationItem({
              index,
              course,
              module,
              challenge,
            });
          },
        );
      }
    });
  };

  handleSortChallengesEnd = (
    course: CourseSkeleton,
    module: ModuleSkeleton,
    sortEndResult: SortEnd,
  ) => {
    this.props.reorderChallengeList({
      courseId: course.id,
      moduleId: module.id,
      challengeOldIndex: sortEndResult.oldIndex,
      challengeNewIndex: sortEndResult.newIndex,
    });
  };

  renderModuleNavigationItem = (
    activeModuleId: string,
    module: ModuleSkeleton,
    index: number,
  ) => {
    return (
      <ModuleNavigationButton
        key={module.id}
        id={`module-navigation-${index}`}
        active={module.id === activeModuleId}
        onClick={() => this.props.setCurrentModule(module.id)}
      >
        <span>
          <ModuleNumber>{index}</ModuleNumber>
          {module.title}
        </span>
      </ModuleNavigationButton>
    );
  };

  renderChallengeNavigationItem = (args: {
    index: number;
    isSection?: boolean;
    sectionChallengeCount?: number;
    sectionChallenges?: ChallengeSkeleton[];
    module: ModuleSkeleton;
    course: CourseSkeleton;
    challenge: ChallengeSkeleton;
    style?: React.CSSProperties;
  }) => {
    const { challengeId, isEditMode } = this.props;
    const {
      index,
      module,
      course,
      isSection,
      challenge,
      sectionChallengeCount = 0,
      sectionChallenges = [],
      style = {},
    } = args;
    const isSectionOpen = this.getCurrentAccordionViewState(challenge.id);
    const iconProps = {
      challenge,
      isSectionOpen,
    };

    const ChallengeIconUI = isEditMode
      ? SortableHandle(ChallengeListItemIcon)
      : ChallengeListItemIcon;

    const toggleSection = (e: React.MouseEvent) => {
      e.preventDefault();
      this.toggleExpandCollapse(challenge);
    };

    const isChallengeComplete = this.checkChallengeUserProgress(
      course.id,
      challenge.id,
    );
    const sectionChallengeCompleteCount = sectionChallenges.reduce(
      (acc, { id }) =>
        this.checkChallengeUserProgress(course.id, id) ? acc + 1 : acc,
      0,
    );

    return (
      <div key={challenge.id} style={{ position: "relative", ...style }}>
        <Link
          key={challenge.id}
          to={`/workspace/${challenge.id}`}
          id={`challenge-navigation-${index}`}
          isActive={() => challenge.id === challengeId}
          onClick={this.handleClickChallenge(
            challenge.userCanAccess,
            course.id,
          )}
        >
          <span className="content">
            <ChallengeIconUI {...iconProps} onClick={toggleSection} />

            <span style={{ marginLeft: 10 }}>{challenge.title}</span>
          </span>
          <span>
            {isSection ? (
              <Badge onClick={toggleSection}>
                {sectionChallengeCompleteCount} of {sectionChallengeCount}{" "}
                Challenge
                {sectionChallengeCount > 1 ? "s " : " "}
                Complete
              </Badge>
            ) : challenge.videoUrl ? (
              <Tooltip
                usePortal={false}
                position="left"
                content="Includes Video"
              >
                <Icon iconSize={Icon.SIZE_LARGE} icon="video" />
              </Tooltip>
            ) : null}
            {!isSection && isChallengeComplete && (
              <Icon
                color={COLORS.SECONDARY_PINK}
                iconSize={Icon.SIZE_LARGE}
                icon="endorsed"
              />
            )}
          </span>
        </Link>
        {this.renderChallengeCodepressButton(course, module, index)}
      </div>
    );
  };

  checkChallengeUserProgress = (courseId: string, challengeId: string) => {
    if (
      this.props.userProgress &&
      this.props.userProgress[courseId] &&
      challengeId in this.props.userProgress[courseId] &&
      this.props.userProgress[courseId][challengeId].complete
    ) {
      return true;
    }
    return false;
  };

  renderModuleCodepressButton = (course: CourseSkeleton, index: number) => {
    const { isEditMode } = this.props;
    return (
      <AddNavItemPositionContainer>
        <AddNavItemButton
          show={isEditMode}
          onClick={() =>
            this.props.createCourseModule({
              courseId: course.id,
              insertionIndex: index + 1,
              module: generateEmptyModule(),
            })
          }
        />
      </AddNavItemPositionContainer>
    );
  };

  renderChallengeCodepressButton = (
    course: CourseSkeleton,
    module: ModuleSkeleton,
    index: number,
  ) => {
    const { isEditMode, overlayVisible } = this.props;

    // Do not render outside of Codepress
    if (!isEditMode) {
      return null;
    }

    return (
      <div style={{ position: "relative" }}>
        <AddNavItemPositionContainer>
          <Popover
            canEscapeKeyClose
            // NOTE: canEscapeKeyClose does not work, use disabled prop to force
            // the menu to close when the overlay is not visible!
            disabled={!overlayVisible}
            content={
              <Menu>
                <MenuItem
                  icon="bookmark"
                  text="Section"
                  onClick={() =>
                    this.handleAddChallenge(course, module, index, {
                      type: "section",
                    })
                  }
                />
                <MenuItem
                  icon="insert"
                  text="Challenge"
                  onClick={() => this.handleAddChallenge(course, module, index)}
                />
              </Menu>
            }
            position={Position.RIGHT}
          >
            <AddNavItemButton show={isEditMode} onClick={() => null} />
          </Popover>
        </AddNavItemPositionContainer>
      </div>
    );
  };

  handleAddChallenge = (
    course: CourseSkeleton,
    module: ModuleSkeleton,
    index: number,
    overrides?: Partial<Challenge>,
  ) => {
    this.props.createChallenge({
      courseId: course.id,
      moduleId: module.id,
      insertionIndex: index + 1,
      challenge: generateEmptyChallenge(overrides),
    });
  };

  handleClose = () => {
    if (this.props.overlayVisible) {
      this.props.setNavigationMapState(false);
    }
  };

  handleClickChallenge = (userCanAccess: boolean, courseId: string) => (
    event: any,
  ) => {
    if (!userCanAccess) {
      event.preventDefault();
      this.props.handlePaymentCourseIntent({
        courseId,
        showToastWarning: true,
      });
    }
  };

  getCurrentAccordionViewState = (sectionId: string) => {
    const { navigationAccordionViewState } = this.props;
    if (sectionId in navigationAccordionViewState) {
      return navigationAccordionViewState[sectionId];
    } else {
      return true; /* Default to open */
    }
  };

  handleToggleNavigationMap = () => {
    this.props.setNavigationMapState(!this.props.overlayVisible);
  };

  navigateLeft = (e: KeyboardEvent) => {
    const { challengeId, nextPrevChallengeIds } = this.props;
    const { prev } = nextPrevChallengeIds;
    if (prev && challengeId) {
      this.props.setAndSyncChallengeId({
        currentChallengeId: prev.id,
        previousChallengeId: challengeId,
      });
    }
  };

  navigateRight = (e: KeyboardEvent) => {
    const { challengeId, nextPrevChallengeIds } = this.props;
    const { next } = nextPrevChallengeIds;
    if (next && challengeId) {
      this.props.setAndSyncChallengeId({
        currentChallengeId: next.id,
        previousChallengeId: challengeId,
      });
    }
  };

  navigateToSandBox = () => {
    /**
     * NOTE: This will only work anyway if the user is already viewing
     * the Workspace.
     */
    const { challengeId } = this.props;
    if (challengeId) {
      this.props.setAndSyncChallengeId({
        currentChallengeId: SANDBOX_ID,
        previousChallengeId: challengeId || "",
      });
    }
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const DoneScrolling = styled((props: any) => (
  <div {...props}>
    <p style={{ opacity: 0.8 }}>You're at the end of the list!</p>
    <p>{"🎉"}</p>
  </div>
))`
  text-align: center;
  margin: 40px 0;
`;

const AddNavItemPositionContainer = styled.div`
  z-index: 5;
  top: 100%;
  left: 50%;
  position: absolute;
`;

interface AddNavItemButtonProps {
  onClick: () => any;
  show: boolean;
}

const AddNavItemButton = styled(({ show, ...props }: AddNavItemButtonProps) => {
  return <button {...props}>+</button>;
})`
  transform: translate(-50%, -50%) scale(${props => (props.show ? 1 : 0)});
  transition: all 0.15s ease-out;
  font-weight: bold;
  font-size: 12px;
  cursor: pointer;
  outline: none;
  border-radius: 100px;
  &:hover {
    transform: translate(-50%, -50%) scale(1.3);
  }
`;

const Link = styled(NavLink)<NavLinkProps & { active?: boolean }>`
  cursor: pointer;
  padding: 12px;
  border: 1px solid transparent;
  border-bottom-color: ${COLORS.LIGHT_GREY};
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  outline: none;
  color: ${COLORS.TEXT_TITLE} !important;
  background: transparent;
  position: relative;

  &:after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    transition: all 0.15s ease-out;
    transform: scale(0);
    width: 3px;
    background: ${COLORS.GRADIENT_GREEN};
  }

  &.active {
    color: white !important;
    background: ${COLORS.BACKGROUND_MODAL};
    &:after {
      transform: scale(1);
    }
  }

  .content {
    font-size: 18px;
    display: flex;
    align-items: center;
  }

  &:hover {
    color: white;
    background: #0d0d0d;
    &:after {
      transform: scale(1);
    }
  }
`;

const ModuleNavigationButtonBase = styled(ModuleNavigationBase)<{
  active?: boolean;
}>`
  outline: none;
  color: ${({ active }) => (active ? "white" : COLORS.TEXT_TITLE)};
  background: ${({ active }) =>
    active ? COLORS.BACKGROUND_MODAL : "transparent"};

  &:hover {
    color: white;
    background: #0d0d0d;
    &:after {
      transform: scale(1);
    }
  }
`;

const ModuleNavigationButton = ({
  active,
  ...rest
}: { active?: boolean } & any) => (
  <ModuleNavigationButtonBase active={active} as="button" {...rest} />
);

const RotatingIcon = styled(Icon)<{ isRotated?: boolean }>`
  transform: ${props =>
    `rotate3d(0,0,1,${props.isRotated ? "0deg" : "-90deg"})`};
  transition: transform 0.2s linear;
`;

interface ChallengeListItemIconProps {
  challenge: ChallengeSkeleton;
  isSectionOpen?: boolean;
  onClick: (e: React.MouseEvent) => any;
}

const ChallengeListItemIcon = ({
  isSectionOpen,
  challenge,
  ...props
}: ChallengeListItemIconProps) => (
  <RotatingIcon
    isRotated={isSectionOpen}
    iconSize={Icon.SIZE_LARGE}
    icon={getChallengeIcon(challenge.type, challenge.userCanAccess)}
    {...props}
  />
);

const Badge = styled.div`
  border-radius: 100px;
  font-size: 11px;
  font-weight: bold;
  background: #505052;
  padding: 4px 12px;
`;

const Col = styled.div<{ offsetX: number }>`
  display: block;
  width: 300px;
  background: ${COLORS.BACKGROUND_CONTENT};
  border-right: 1px solid ${COLORS.LIGHT_GREY};
  position: relative;
  z-index: 2;
  transition: all 0.2s ease-out;
  transform: translateX(${({ offsetX }) => `${offsetX}px`});
`;

const ScrollableContent = styled.div`
  height: calc(100% - 40px);
  overflow: auto;
`;

const Overlay = styled.div<{ visible: boolean }>`
  top: ${HEADER_HEIGHT}px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 15;
  position: fixed;
  background: rgba(0, 0, 0, 0.85);
  visibility: ${props => (props.visible ? "visible" : "hidden")};
  opacity: ${props => (props.visible ? "1" : "0")};
  pointer-events: ${props => (props.visible ? "all" : "none")};
  display: flex;
  transition: all 0.2s ease-out;
`;

const Title = styled.div`
  font-size: 18px;
  font-weight: 200;
  color: white;
  margin: 0;
  height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid ${COLORS.LIGHT_GREY};
  font-variant: small-caps;
  font-weight: bold;
  letter-spacing: 2;
  background: #404040;
  display: flex;
  align-items: center;
  justify-content: space-between;

  p {
    margin: 0;
  }
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  userSettings: Modules.selectors.user.userSettings(state),
  userProgress: Modules.selectors.user.userProgress(state),
  isEditMode: Modules.selectors.challenges.isEditMode(state),
  module: Modules.selectors.challenges.getCurrentModule(state),
  course: Modules.selectors.challenges.getCurrentCourseSkeleton(state),
  challengeId: Modules.selectors.challenges.getCurrentChallengeId(state),
  nextPrevChallengeIds: Modules.selectors.challenges.nextPrevChallenges(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
  navigationAccordionViewState: Modules.selectors.challenges.getNavigationSectionAccordionViewState(
    state,
  ),
});

const ChallengeActions = Modules.actions.challenges;

const dispatchProps = {
  setAndSyncChallengeId: ChallengeActions.setAndSyncChallengeId,
  setCurrentModule: ChallengeActions.setCurrentModule,
  createCourseModule: ChallengeActions.createCourseModule,
  updateCourseModule: ChallengeActions.updateCourseModule,
  deleteCourseModule: ChallengeActions.deleteCourseModule,
  createChallenge: ChallengeActions.createChallenge,
  deleteChallenge: ChallengeActions.deleteChallenge,
  reorderChallengeList: ChallengeActions.reorderChallengeList,
  reorderModuleList: ChallengeActions.reorderModuleList,
  updateUserSettings: Modules.actions.user.updateUserSettings,
  setNavigationMapState: ChallengeActions.setNavigationMapState,
  toggleSectionAccordionView: ChallengeActions.toggleSectionAccordionView,
  setSingleSignOnDialogState: Modules.actions.auth.setSingleSignOnDialogState,
  handlePaymentCourseIntent: Modules.actions.payments.handlePaymentCourseIntent,
};

const mergeProps = (
  state: ReturnType<typeof mapStateToProps>,
  methods: typeof dispatchProps,
  props: {},
) => ({
  ...props,
  ...methods,
  ...state,
  toggleEditorSize: () => {
    methods.updateUserSettings({
      fullScreenEditor: !state.userSettings.fullScreenEditor,
    });
  },
});

type ConnectProps = ReturnType<typeof mergeProps>;

type IProps = ConnectProps & ComponentProps;

interface ComponentProps {
  overlayVisible: boolean;
}

const withProps = connect(mapStateToProps, dispatchProps, mergeProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(NavigationOverlay);
