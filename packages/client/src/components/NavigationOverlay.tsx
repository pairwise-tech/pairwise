import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import {
  SortEnd,
  SortableHandle,
  SortableContainer,
  SortableElement,
} from "react-sortable-hoc";
import {
  ChallengeSkeleton,
  CourseSkeleton,
  ModuleSkeleton,
  Challenge,
  ChallengeSkeletonList,
  ModuleSkeletonList,
} from "@pairwise/common";
import Modules, { ReduxStoreState } from "modules/root";
import { COLORS, HEADER_HEIGHT, SANDBOX_ID } from "tools/constants";
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
  ContextMenu,
} from "@blueprintjs/core";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { NavLink, NavLinkProps } from "react-router-dom";
import { DarkTheme } from "./Shared";

const debug = require("debug")("client:NavigationOverlay");

/** ===========================================================================
 * React Class
 * ============================================================================
 */

class NavigationOverlay extends React.Component<IProps> {
  componentDidMount() {
    this.lockWindowScrolling();
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
    const { course, module } = this.props;

    if (!course || !module) {
      debug("[INFO] No module or course", course, module);
      return null;
    }

    return (
      <Overlay visible={this.props.overlayVisible} onClick={this.handleClose}>
        <KeyboardShortcuts
          keymap={{
            // TODO: Add some UI to display what key shortcuts are available:
            escape: this.handleClose,
            "cmd+k": this.navigateToSandBox,
            "cmd+j": this.handleToggleNavigationMap,
            "cmd+[": this.navigateLeft,
            "cmd+]": this.navigateRight,
            "cmd+,": this.props.toggleEditorSize /* cmd+[ ~ whatever! */,
          }}
        />
        <Col
          offsetX={this.props.overlayVisible ? 0 : -20}
          style={{ zIndex: 3 }}
          onClick={e => e.stopPropagation()}
        >
          <Title>{course.title}</Title>
          {/* In case of no challenges yet, or to add one at the start, here's a button */}
          <div style={{ position: "relative" }}>
            {this.renderModuleCodepressButton(course, -1)}
          </div>
          {this.renderSortableModuleList(course, module, course.modules)}
        </Col>
        <Col
          offsetX={this.props.overlayVisible ? 0 : -60}
          style={{
            width: 600,
            zIndex: 2,
            boxShadow: "inset 20px 0px 20px 0px rgba(0, 0, 0, 0.1)",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* In case of no challenges yet, or to add one at the start, here's a button */}
          {this.renderChallengeCodepressButton(course, module, -1)}
          {this.renderSortableChallengeList(course, module, module.challenges)}
          <DoneScrolling />
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

    const handleDeleteModule = () => {
      this.props.deleteCourseModule({ id: module.id, courseId: course.id });
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
              section: true,
              index: blockIndex,
              challenge: block.section,
            })}
            <Collapse
              isOpen={this.getCurrentAccordionViewState(block.section.id)}
            >
              {block.challenges.map(
                (challenge: ChallengeSkeleton, index: number) => {
                  return this.renderChallengeNavigationItem({
                    module,
                    course,
                    challenge,
                    index: blockIndex,
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
              module,
              course,
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
    section?: boolean;
    module: ModuleSkeleton;
    course: CourseSkeleton;
    challenge: ChallengeSkeleton;
  }) => {
    const { challengeId, isEditMode } = this.props;
    const { index, module, course, section, challenge } = args;

    const ChallengeIcon = () => (
      <Icon
        iconSize={Icon.SIZE_LARGE}
        icon={getChallengeIcon(challenge.type, challenge.userCanAccess)}
      />
    );

    const ChallengeIconUI = isEditMode
      ? SortableHandle(() => <ChallengeIcon />)
      : ChallengeIcon;

    const sectionViewState = this.getCurrentAccordionViewState(challenge.id);

    return (
      <div key={challenge.id} style={{ position: "relative" }}>
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
          <span>
            <ChallengeIconUI />
            <span style={{ marginLeft: 10 }}>{challenge.title}</span>
          </span>
          <span>
            {section ? (
              <Tooltip
                position="right"
                usePortal={false}
                content={`${sectionViewState ? "Collapse" : "Expand"} Section`}
              >
                <Icon
                  iconSize={Icon.SIZE_LARGE}
                  icon={sectionViewState ? "collapse-all" : "expand-all"}
                  onClick={(
                    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
                  ) => {
                    e.preventDefault();
                    this.props.toggleSectionAccordionView({
                      sectionId: challenge.id,
                      open: !sectionViewState,
                    });
                  }}
                />
              </Tooltip>
            ) : challenge.videoUrl ? (
              <Tooltip
                usePortal={false}
                position="left"
                content="Includes Video"
              >
                <Icon iconSize={Icon.SIZE_LARGE} icon="video" />
              </Tooltip>
            ) : null}
          </span>
        </Link>
        {this.renderChallengeCodepressButton(course, module, index)}
      </div>
    );
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
      this.props.handlePurchaseCourseIntent({ courseId });
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
      this.props.setChallengeId({
        newChallengeId: prev.id,
        previousChallengeId: challengeId,
      });
    }
  };

  navigateRight = (e: KeyboardEvent) => {
    const { challengeId, nextPrevChallengeIds } = this.props;
    const { next } = nextPrevChallengeIds;
    if (next && challengeId) {
      this.props.setChallengeId({
        newChallengeId: next.id,
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
      this.props.setChallengeId({
        newChallengeId: SANDBOX_ID,
        previousChallengeId: challengeId || "",
      });
    }
  };
}

/** ===========================================================================
 * Context Menu
 * ============================================================================
 */

class CodepressNavigationContextMenu extends React.PureComponent<
  {
    type: "MODULE" | "CHALLENGE";
    handleDelete: () => void;
  },
  { isContextMenuOpen: boolean }
> {
  state = { isContextMenuOpen: false };

  render() {
    return (
      <div onContextMenu={this.showContextMenu}>{this.props.children}</div>
    );
  }

  showContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    const { type } = this.props;
    const label = type === "MODULE" ? "Delete Module" : "Delete Challenge";

    const Context = (
      <DarkTheme>
        <Menu>
          <MenuItem
            icon="cross"
            text={label}
            onClick={this.props.handleDelete}
          />
        </Menu>
      </DarkTheme>
    );

    const coordinates = { left: e.clientX, top: e.clientY };

    ContextMenu.show(Context, coordinates, () =>
      this.setState({ isContextMenuOpen: false }),
    );

    this.setState({ isContextMenuOpen: true });
  };
}

/** ===========================================================================
 * Sortable List Components
 * ============================================================================
 */

interface SortableModuleContainerProps {
  isEditMode: boolean;
  course: CourseSkeleton;
  currentActiveModule: ModuleSkeleton;
  updateCourseModule: typeof Modules.actions.challenges.updateCourseModule;
  handleDeleteModule: () => void;
  renderModuleNavigationItem: (
    activeModuleId: string,
    module: ModuleSkeleton,
    index: number,
  ) => JSX.Element;
  renderModuleCodepressButton: (
    course: CourseSkeleton,
    index: number,
  ) => JSX.Element;
}

interface SortableModuleItemValue extends SortableModuleContainerProps {
  index: number;
  module: ModuleSkeleton;
}

const SortableModuleList = SortableContainer(
  ({
    items: modules,
    itemValueProps,
  }: {
    items: ModuleSkeletonList;
    itemValueProps: SortableModuleContainerProps;
  }) => {
    return (
      <UnorderedList>
        {modules.map((m: ModuleSkeleton, index: number) => {
          return (
            <SortableModuleItem
              key={m.id}
              index={index}
              value={{ module: m, index, ...itemValueProps }}
            />
          );
        })}
      </UnorderedList>
    );
  },
);

const SortableModuleItem = SortableElement(
  (props: { value: SortableModuleItemValue }) => {
    const {
      index,
      module,
      course,
      isEditMode,
      handleDeleteModule,
      currentActiveModule,
      updateCourseModule,
      renderModuleNavigationItem,
      renderModuleCodepressButton,
    } = props.value;

    const DraggableModuleHandle = SortableHandle(() => (
      <ModuleNumber>{index}</ModuleNumber>
    ));

    return (
      <UnorderedListItem>
        <div key={module.id} style={{ position: "relative" }}>
          {isEditMode ? (
            <CodepressNavigationContextMenu
              type="MODULE"
              handleDelete={handleDeleteModule}
            >
              <ModuleNavigationBase
                active={currentActiveModule.id === module.id}
              >
                <span>
                  <DraggableModuleHandle />
                  <NavUpdateField
                    value={module.title}
                    onChange={e => {
                      updateCourseModule({
                        id: module.id,
                        courseId: course.id,
                        module: { title: e.target.value },
                      });
                    }}
                  />
                </span>
              </ModuleNavigationBase>
            </CodepressNavigationContextMenu>
          ) : (
            renderModuleNavigationItem(module.id, module, index)
          )}
          {renderModuleCodepressButton(course, index)}
        </div>
      </UnorderedListItem>
    );
  },
);

interface SortableChallengeContainerProps {
  isEditMode: boolean;
  course: CourseSkeleton;
  module: ModuleSkeleton;
  renderChallengeNavigationItem: (args: {
    index: number;
    section?: boolean;
    module: ModuleSkeleton;
    course: CourseSkeleton;
    challenge: ChallengeSkeleton;
  }) => JSX.Element;
  deleteChallenge: typeof Modules.actions.challenges.deleteChallenge;
}

interface SortableChallengeItemValue extends SortableChallengeContainerProps {
  index: number;
  challenge: ChallengeSkeleton;
}

const SortableChallengeItem = SortableElement(
  (props: { value: SortableChallengeItemValue }) => {
    const {
      index,
      course,
      module,
      challenge,
      isEditMode,
      deleteChallenge,
      renderChallengeNavigationItem,
    } = props.value;

    if (isEditMode) {
      return (
        <UnorderedListItem>
          <CodepressNavigationContextMenu
            type="CHALLENGE"
            handleDelete={() =>
              deleteChallenge({
                courseId: course.id,
                moduleId: module.id,
                challengeId: challenge.id,
              })
            }
          >
            {renderChallengeNavigationItem({
              module,
              course,
              challenge,
              index,
            })}
          </CodepressNavigationContextMenu>
        </UnorderedListItem>
      );
    } else {
      return (
        <UnorderedListItem>
          {renderChallengeNavigationItem({ module, course, challenge, index })}
        </UnorderedListItem>
      );
    }
  },
);

const SortableChallengeList = SortableContainer(
  ({
    items: challenges,
    itemValueProps,
  }: {
    items: ChallengeSkeletonList;
    itemValueProps: SortableChallengeContainerProps;
  }) => {
    return (
      <UnorderedList>
        {challenges.map((challenge: ChallengeSkeleton, index: number) => {
          return (
            <SortableChallengeItem
              index={index}
              key={challenge.id}
              value={{ challenge, index, ...itemValueProps }}
            />
          );
        })}
      </UnorderedList>
    );
  },
);

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

const UnorderedList = styled.ul`
  list-style-type: none;
  margin: 0;
  padding: 0;
`;

const UnorderedListItem = styled.li`
  margin: 0;
  padding: 0;
`;

const ModuleNumber = styled.code`
  font-size: 12px;
  display: inline-block;
  padding: 5px;
  color: #ea709c;
  background: #3a3a3a;
  width: 24px;
  text-align: center;
  line-height: 12px;
  border-radius: 4px;
  box-shadow: inset 0px 0px 2px 0px #ababab;
  margin-right: 8px;
`;

const NavUpdateField = styled.input`
  padding: 0;
  font-size: 18px;
  border: 1px solid transparent;
  border-bottom-color: ${COLORS.SEPARATOR_BORDER};
  width: 100%;
  display: block;
  text-align: left;
  outline: none;
  color: white;
  background: transparent;
  position: relative;

  &:hover,
  &:focus {
    color: white;
    background: #0d0d0d;
  }
`;

const Link = styled(NavLink)<NavLinkProps & { active?: boolean }>`
  cursor: pointer;
  padding: 12px;
  font-size: 18px;
  border: 1px solid transparent;
  border-bottom-color: ${COLORS.SEPARATOR_BORDER};
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

  span {
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

const ModuleNavigationBase = styled.div<{ active?: boolean }>`
  cursor: pointer;
  padding-left: 12px;
  padding-top: 12px;
  padding-bottom: 12px;
  padding-right: 2px;
  font-size: 18px;
  border: 1px solid transparent;
  border-bottom-color: ${COLORS.SEPARATOR_BORDER};
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  position: relative;

  span {
    display: flex;
    align-items: center;
  }

  &:after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    transition: all 0.15s ease-out;
    transform: scale(${({ active }) => (active ? 1 : 0)});
    width: 3px;
    background: ${COLORS.GRADIENT_GREEN};
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

const Col = styled.div<{ offsetX: number }>`
  display: block;
  width: 300px;
  background: ${COLORS.BACKGROUND_CONTENT};
  border-right: 1px solid ${COLORS.SEPARATOR_BORDER};
  position: relative;
  z-index: 2;
  transition: all 0.2s ease-out;
  transform: translateX(${({ offsetX }) => `${offsetX}px`});
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

const Title = styled.p`
  font-size: 18px;
  font-weight: 200;
  color: ${COLORS.TEXT_TITLE};
  margin: 0;
  padding: 12px;
  border-bottom: 1px solid ${COLORS.SEPARATOR_BORDER};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  userSettings: Modules.selectors.user.userSettings(state),
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
  setChallengeId: ChallengeActions.setChallengeId,
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
  handlePurchaseCourseIntent:
    Modules.actions.purchase.handlePurchaseCourseIntent,
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
