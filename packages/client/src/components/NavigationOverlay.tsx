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
import { COLORS, HEADER_HEIGHT } from "tools/constants";
import {
  composeWithProps,
  generateEmptyModule,
  generateEmptyChallenge,
  getChallengeIcon,
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
        <KeyboardShortcuts keymap={{ escape: this.handleClose }} />
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

    /* Reordering is only available in edit mode */
    if (!isEditMode) {
      /**
       * Partition the challenges into blocks separate by section. This is
       * the greatest code ever written:
       */
      const partitionChallengesBySection = () => {
        interface Section {
          section: Nullable<ChallengeSkeleton>;
          challenges: ChallengeSkeleton[];
        }

        let sections: Section[] = [];
        const defaultSection: Section = { section: null, challenges: [] };

        const finalSection = challengeList.reduce(
          (currentSection: Section, challenge: ChallengeSkeleton) => {
            if (challenge.type === "section") {
              if (currentSection.challenges.length > 0) {
                sections = sections.concat(currentSection);
              }

              const nextSection: Section = {
                section: challenge,
                challenges: [],
              };
              return nextSection;
            } else {
              return {
                section: currentSection.section,
                challenges: currentSection.challenges.concat(challenge),
              };
            }
          },
          defaultSection,
        );

        sections = sections.concat(finalSection);

        return sections;
      };

      const sectionBlocks = partitionChallengesBySection();

      /**
       * Render the section blocks:
       */
      return sectionBlocks.map((block, blockIndex) => {
        if (block.section) {
          return (
            <div key={blockIndex}>
              {this.renderChallengeSectionNavigationItem(
                module,
                course,
                block.section,
                blockIndex,
              )}
              <Collapse
                isOpen={this.getCurrentAccordionViewState(block.section.id)}
              >
                {block.challenges.map(
                  (challenge: ChallengeSkeleton, index: number) => {
                    return this.renderChallengeNavigationItem(
                      module,
                      course,
                      challenge,
                      blockIndex,
                    );
                  },
                )}
              </Collapse>
            </div>
          );
        } else {
          return block.challenges.map(
            (challenge: ChallengeSkeleton, index: number) => {
              return this.renderChallengeNavigationItem(
                module,
                course,
                challenge,
                index,
              );
            },
          );
        }
      });
    }

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

  renderChallengeSectionNavigationItem = (
    module: ModuleSkeleton,
    course: CourseSkeleton,
    c: ChallengeSkeleton,
    index: number,
  ) => {
    const { challengeId, isEditMode } = this.props;

    const ChallengeIcon = () => (
      <Icon
        iconSize={Icon.SIZE_LARGE}
        icon={getChallengeIcon(c.type, c.userCanAccess)}
      />
    );

    const ChallengeIconUI = isEditMode
      ? SortableHandle(() => <ChallengeIcon />)
      : ChallengeIcon;

    const currentState = this.getCurrentAccordionViewState(c.id);

    return (
      <div key={c.id} style={{ position: "relative" }}>
        <Link
          key={c.id}
          to={`/workspace/${c.id}`}
          id={`challenge-navigation-${index}`}
          isActive={() => c.id === challengeId}
          onClick={this.handleClickChallenge(c.userCanAccess, course.id)}
        >
          <span>
            <ChallengeIconUI />
            <span style={{ marginLeft: 10 }}>{c.title}</span>
          </span>
          <span>
            <Tooltip
              position="right"
              usePortal={false}
              content={`${currentState ? "Collapse" : "Expand"} Section`}
            >
              <Icon
                iconSize={Icon.SIZE_LARGE}
                icon="expand-all"
                onClick={(
                  e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
                ) => {
                  e.preventDefault();
                  /* toggle section by the section challenge id, i.e. c.id */
                  this.props.toggleSectionAccordionView({
                    sectionId: c.id,
                    open: !currentState,
                  });
                }}
              />
            </Tooltip>
          </span>
        </Link>
        {this.renderChallengeCodepressButton(course, module, index)}
      </div>
    );
  };

  getCurrentAccordionViewState = (sectionId: string) => {
    const { navigationAccordionViewState } = this.props;
    if (sectionId in navigationAccordionViewState) {
      return navigationAccordionViewState[sectionId];
    } else {
      return false; /* Default to closed */
    }
  };

  renderChallengeNavigationItem = (
    module: ModuleSkeleton,
    course: CourseSkeleton,
    c: ChallengeSkeleton,
    index: number,
  ) => {
    const { challengeId, isEditMode } = this.props;

    const ChallengeIcon = () => (
      <Icon
        iconSize={Icon.SIZE_LARGE}
        icon={getChallengeIcon(c.type, c.userCanAccess)}
      />
    );

    const ChallengeIconUI = isEditMode
      ? SortableHandle(() => <ChallengeIcon />)
      : ChallengeIcon;

    return (
      <div key={c.id} style={{ position: "relative" }}>
        <Link
          key={c.id}
          to={`/workspace/${c.id}`}
          id={`challenge-navigation-${index}`}
          isActive={() => c.id === challengeId}
          onClick={this.handleClickChallenge(c.userCanAccess, course.id)}
        >
          <span>
            <ChallengeIconUI />
            <span style={{ marginLeft: 10 }}>{c.title}</span>
          </span>
          <span>
            {c.videoUrl && (
              <Tooltip
                usePortal={false}
                position="left"
                content="Includes Video"
              >
                <Icon iconSize={Icon.SIZE_LARGE} icon="video" />
              </Tooltip>
            )}
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
  renderChallengeNavigationItem: (
    module: ModuleSkeleton,
    course: CourseSkeleton,
    challenge: ChallengeSkeleton,
    index: number,
  ) => JSX.Element;
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
            {renderChallengeNavigationItem(module, course, challenge, index)}
          </CodepressNavigationContextMenu>
        </UnorderedListItem>
      );
    } else {
      return (
        <UnorderedListItem>
          {renderChallengeNavigationItem(module, course, challenge, index)}
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
  isEditMode: Modules.selectors.challenges.isEditMode(state),
  module: Modules.selectors.challenges.getCurrentModule(state),
  course: Modules.selectors.challenges.getCurrentCourseSkeleton(state),
  challengeId: Modules.selectors.challenges.getCurrentChallengeId(state),
  navigationAccordionViewState: Modules.selectors.challenges.getNavigationSectionAccordionViewState(
    state,
  ),
});

const dispatchProps = {
  setCurrentModule: Modules.actions.challenges.setCurrentModule,
  createCourseModule: Modules.actions.challenges.createCourseModule,
  updateCourseModule: Modules.actions.challenges.updateCourseModule,
  deleteCourseModule: Modules.actions.challenges.deleteCourseModule,
  createChallenge: Modules.actions.challenges.createChallenge,
  deleteChallenge: Modules.actions.challenges.deleteChallenge,
  reorderChallengeList: Modules.actions.challenges.reorderChallengeList,
  reorderModuleList: Modules.actions.challenges.reorderModuleList,
  setNavigationMapState: Modules.actions.challenges.setNavigationMapState,
  toggleSectionAccordionView:
    Modules.actions.challenges.toggleSectionAccordionView,
  setSingleSignOnDialogState: Modules.actions.auth.setSingleSignOnDialogState,
  handlePurchaseCourseIntent:
    Modules.actions.purchase.handlePurchaseCourseIntent,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps & ComponentProps;

interface ComponentProps {
  overlayVisible: boolean;
}

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(NavigationOverlay);
