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
  CHALLENGE_PROGRESS,
  getChallengeSlug,
  CourseMetadata,
} from "@pairwise/common";
import Modules, { ReduxStoreState } from "modules/root";
import { COLORS, MOBILE } from "tools/constants";
import { HEADER_HEIGHT } from "tools/dimensions";
import {
  composeWithProps,
  generateEmptyModule,
  generateEmptyChallenge,
  getChallengeIcon,
  partitionChallengesBySection,
  getChallengeProgress,
  getSectionProgress,
} from "tools/utils";
import {
  Icon,
  Collapse,
  Menu,
  MenuItem,
  Position,
  Button,
  IconSize,
} from "@blueprintjs/core";
import { Popover2, Tooltip2 } from "@blueprintjs/popover2";
import { NavLink, NavLinkProps, RouteComponentProps } from "react-router-dom";
import {
  SortableModuleList,
  SortableChallengeList,
  ModuleNumber,
  ModuleNavigationBase,
} from "./NavigationOverlayComponents";
import { IconButton, RotatingIcon } from "./SharedComponents";
import cx from "classnames";
import { Select } from "@blueprintjs/select";
import { defaultTextColor, IThemeProps, themeColor } from "./ThemeContainer";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const CourseSelect = Select.ofType<CourseMetadata>();

// Class names for active and selected elements in the navigation overlay
const ACTIVE_CHALLENGE_CLASS_NAME = "active-challenge";
const SELECTED_ITEM_CLASS_NAME = "selected-item";

/** ===========================================================================
 * React Class
 * ============================================================================
 */

class NavigationOverlay extends React.Component<
  IProps,
  { showModuleList: boolean }
> {
  state = {
    showModuleList: false,
  };

  toggleModuleListOpen = () => {
    this.setState({
      showModuleList: !this.state.showModuleList,
    });
  };

  componentDidMount() {
    this.lockWindowScrolling();
  }

  // Don't re-render when the nav is not open
  shouldComponentUpdate(nextProps: IProps) {
    if (this.props.user !== nextProps.user) {
      return true;
    } else {
      return this.props.overlayVisible || nextProps.overlayVisible;
    }
  }

  componentDidUpdate(prevProps: IProps) {
    this.lockWindowScrolling();

    this.maybeScrollSelectedItemIntoView();

    if (this.props.overlayVisible) {
      // Scroll to active challenge if overlay was previously closed
      if (!prevProps.overlayVisible) {
        this.scrollToChallenge();
      }

      // If rendering the overlay, blur the active element, which is probably
      // the workspace editor, to allow keyboard interactions to control
      // the NavigationOverlay selection
      const el = document.activeElement;
      if (el) {
        // @ts-ignore
        document.activeElement.blur();
      }
    }
  }

  render(): Nullable<JSX.Element> {
    const {
      course,
      module,
      isMobile,
      isEditMode,
      challengeId,
      overlayVisible,
      courseListMetadata,
    } = this.props;

    // Course or model is still loading
    if (!course || !module) {
      return null;
    }

    const sectionIds = module.challenges
      .filter((x) => x.type === "section")
      .map((x) => x.id);
    const hasSections = sectionIds.length > 0;
    const anySectionsOpen =
      hasSections && sectionIds.some(this.getCurrentAccordionViewState);

    // Check if the current module contains the current challenge
    const moduleContainsActiveChallenge = module.challenges.find(
      (c) => c.id === challengeId,
    );

    // Render different expand/collapse button on mobile for better layout
    let ExpandCollapseButton;
    if (isMobile) {
      ExpandCollapseButton = anySectionsOpen ? (
        <Icon icon="collapse-all" />
      ) : (
        <Icon icon="expand-all" />
      );
    } else {
      ExpandCollapseButton = anySectionsOpen
        ? "Collapse All Sections"
        : "Expand All Sections";
    }

    return (
      <Overlay visible={overlayVisible} onClick={this.handleClose}>
        <Col
          style={{ zIndex: 3 }}
          offsetX={overlayVisible ? 0 : -20}
          onClick={(e) => e.stopPropagation()}
          className={cx("module-select", { open: this.state.showModuleList })}
        >
          <ColTitle className="course-select">
            <CourseSelect
              filterable={false}
              items={courseListMetadata}
              itemDisabled={(c) => c.id === course.id}
              onItemSelect={({ id }) => {
                this.props.setNavigationOverlayCurrentCourse(id);
              }}
              popoverProps={{
                onClosed: () => {
                  // Blur the damn element to avoid keyboard interactions
                  // opening the select menu again later.
                  if (document.activeElement) {
                    // @ts-ignore
                    document.activeElement.blur();
                  }
                },
              }}
              itemRenderer={({ title, id }, { handleClick }) => (
                <ClickableColTitle
                  key={id}
                  disabled={id === course.id}
                  onClick={(e: any) => handleClick(e)}
                >
                  {title}
                </ClickableColTitle>
              )}
            >
              <Button
                fill
                rightIcon="chevron-down"
                className="mobile-shrink"
                style={{ whiteSpace: "nowrap" }}
                text={isMobile ? "" : course.title}
              />
            </CourseSelect>
          </ColTitle>
          <ColScroll>
            {/* In case of no challenges yet, or to add one at the start, here's a button */}
            <div style={{ position: "relative" }}>
              {this.renderModuleCodepressButton(course, -1)}
            </div>
            {this.renderSortableModuleList(course, module, course.modules)}
            {/* Spacer div helps rendering the final Codepress Button */}
            <div style={{ height: 22 }} />
          </ColScroll>
        </Col>
        <Col
          style={{ zIndex: 2 }}
          className="challenge-select"
          offsetX={overlayVisible ? 0 : -60}
          onClick={(e) => e.stopPropagation()}
        >
          <SpecialLeftShadow />
          <ColTitle>
            <p style={{ fontSize: isMobile ? 13 : 18 }}>{module.title}</p>
            {hasSections && !isEditMode && (
              <Row>
                {challengeId && moduleContainsActiveChallenge && (
                  <Tooltip2
                    disabled={isMobile}
                    position="bottom"
                    content="Scroll to Active Challenge"
                  >
                    <IconButton
                      icon="send-to-map"
                      style={{ marginRight: 6 }}
                      onClick={() => this.scrollToChallenge()}
                    />
                  </Tooltip2>
                )}
                <Button
                  onClick={this.toggleExpandCollapseAll}
                  style={{ width: isMobile ? "auto" : 160 }}
                >
                  {ExpandCollapseButton}
                </Button>
              </Row>
            )}
          </ColTitle>
          <ColScroll>
            {/* In case of no challenges yet, or to add one at the start, here's a button */}
            {this.renderChallengeCodepressButton(course, module, -1)}
            {this.renderSortableChallengeList(
              course,
              module,
              module.challenges,
            )}
            <DoneScrolling />
          </ColScroll>
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
        onSortEnd={(sortEndResult) =>
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
        onSortEnd={(sortEndResult) =>
          this.handleSortChallengesEnd(course, module, sortEndResult)
        }
      />
    );
  };

  maybeScrollSelectedItemIntoView = () => {
    const { selectedIndex } = this.props.menuSelectState;
    if (selectedIndex === null) {
      return;
    }

    const elements = document.getElementsByClassName(SELECTED_ITEM_CLASS_NAME);
    const element = elements[0];

    if (element && elements.length === 1) {
      if (this.isElementOffScreen(element)) {
        this.scrollToSelectedChallenge();
      }
    }
  };

  lockWindowScrolling = () => {
    // Don't interfere with the scrolling state until the initial loading
    // animation has completed.
    if (!this.props.loadingAnimationComplete) {
      return;
    }

    if (this.props.overlayVisible) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "visible";
      document.documentElement.style.overflow = "visible";
    }
  };

  isElementOffScreen = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const viewHeight = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight,
    );

    const AT_TOP = rect.top < 115;
    const AT_BOTTOM = rect.bottom > viewHeight;
    return AT_TOP || AT_BOTTOM;
  };

  scrollToChallenge = () => {
    // Find the currently active element
    const elements = document.getElementsByClassName(
      ACTIVE_CHALLENGE_CLASS_NAME,
    );

    const element = elements[0];
    // There should only be one active element...
    if (element && elements.length === 1) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  scrollToSelectedChallenge = () => {
    // Find the currently selected element
    const elements = document.getElementsByClassName(SELECTED_ITEM_CLASS_NAME);
    const element = elements[0];
    // There should only be one active element...
    if (element && elements.length === 1) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // This can be used to expand or collapse all sections in the current module.
  toggleExpandCollapseAll = () => {
    const challengeList = this.props.module?.challenges;

    if (!challengeList) {
      return;
    }

    const sectionIds = challengeList
      .filter(({ type }) => type === "section")
      .map((x) => x.id);
    const anyOpen = sectionIds.some(this.getCurrentAccordionViewState);

    // Go through each section and expand or collapse it.
    sectionIds
      .map((id) => ({ sectionId: id, open: !anyOpen }))
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
     * Create and track and index for all the challenges in the section blocked
     * list.
     */
    let serialIndex = -1;

    /**
     * Render the section blocks.
     */
    return sectionBlocks.map((block) => {
      serialIndex++;
      if (block.section) {
        const sectionExpanded = this.getCurrentAccordionViewState(
          block.section.id,
        );
        return (
          <div key={serialIndex}>
            {this.renderChallengeNavigationItem({
              module,
              course,
              isSection: true,
              sectionChallengeCount: block.challenges.length,
              sectionChallenges: block.challenges,
              index: serialIndex,
              challenge: block.section,
              sectionExpanded,
            })}
            <Collapse isOpen={sectionExpanded}>
              {block.challenges.map((challenge: ChallengeSkeleton) => {
                serialIndex++;
                return this.renderChallengeNavigationItem({
                  index: serialIndex,
                  course,
                  module,
                  challenge,
                  style: { marginLeft: 20 },
                });
              })}
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
    const { isMobile } = this.props;
    const { selectedIndex, menuSelectColumn } = this.props.menuSelectState;
    const isMenuItemSelected =
      menuSelectColumn === "modules" && selectedIndex === index;

    return (
      <ModuleNavigationButton
        key={module.id}
        menu_selected={isMenuItemSelected}
        id={`module-navigation-${index}`}
        active={module.id === activeModuleId}
        onClick={() => this.props.setNavigationOverlayCurrentModule(module.id)}
      >
        <span>
          <ModuleNumber>{index}</ModuleNumber>
          {!isMobile && module.title}
        </span>
      </ModuleNavigationButton>
    );
  };

  renderChallengeNavigationItem = (args: {
    index: number;
    isSection?: boolean;
    sectionExpanded?: boolean;
    sectionChallengeCount?: number;
    sectionChallenges?: ChallengeSkeleton[];
    module: ModuleSkeleton;
    course: CourseSkeleton;
    challenge: ChallengeSkeleton;
    style?: React.CSSProperties;
  }) => {
    const {
      user,
      isMobile,
      isEditMode,
      challengeId,
      menuSelectState,
      pullRequestChallengeIds,
    } = this.props;
    const {
      index,
      module,
      course,
      isSection,
      challenge,
      sectionExpanded,
      sectionChallengeCount = 0,
      sectionChallenges = [],
      style = {},
    } = args;

    /**
     * Admins can load course content from a pull request. If they do,
     * check if the current challenge has been modified in the pull request,
     * by comparing against the pullRequestChallengeIds.
     */
    let isModifiedChallenge: boolean = false;
    if (challenge.id !== null) {
      if (pullRequestChallengeIds.has(challenge.id)) {
        isModifiedChallenge = true;
      }
    }

    const isDark = user.settings.appTheme === "dark";
    const { selectedIndex, menuSelectColumn } = menuSelectState;
    const isMenuItemSelected =
      menuSelectColumn === "challenges" && selectedIndex === index;

    const challengeProgress = getChallengeProgress(
      this.props.userProgress,
      course.id,
      challenge.id,
    );
    const sectionChallengesComplete = getSectionProgress(
      sectionChallenges,
      this.props.userProgress,
      course.id,
    );

    const isSectionOpen = this.getCurrentAccordionViewState(challenge.id);
    const iconProps = {
      index,
      isMobile,
      challenge,
      isSectionOpen,
      challengeProgress,
    };

    const ChallengeIconUI = isEditMode
      ? SortableHandle(ChallengeListItemIcon)
      : ChallengeListItemIcon;

    const toggleSection = (e: React.MouseEvent) => {
      // Disabled for locked content
      if (!challenge.userCanAccess) {
        return;
      }

      // Section should not expand/collapse if there are no challenges
      if (sectionChallenges.length > 0) {
        e.preventDefault();
        this.toggleExpandCollapse(challenge);
      }
    };

    // Section is active if it is collapsed and includes the current challenge
    const sectionActive = sectionExpanded
      ? false
      : !!sectionChallenges.find((c) => c.id === challengeId);
    const itemActive = sectionActive || challenge.id === challengeId;

    let className = "";
    if (itemActive) {
      className += ACTIVE_CHALLENGE_CLASS_NAME;
    }
    if (isMenuItemSelected) {
      className += ` ${SELECTED_ITEM_CLASS_NAME}`;
    }

    return (
      <ChallengeNavigationItem
        key={challenge.id}
        className={className}
        id={`challenge-${challenge.id}`}
        style={{ position: "relative", ...style }}
      >
        <ChallengeLink
          selected={isMenuItemSelected}
          challenge_modified={isModifiedChallenge ? "true" : "false"}
          locked={challenge.userCanAccess ? "false" : "true"}
          to={`/workspace/${getChallengeSlug(challenge)}`}
          id={`challenge-navigation-${index}`}
          isActive={() => itemActive}
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
            {isSection && challenge.userCanAccess ? (
              <HoverableBadge onClick={toggleSection}>
                <BadgeDefaultContent>
                  {sectionChallengesComplete} of {sectionChallengeCount}{" "}
                  Complete
                </BadgeDefaultContent>
                <BadgeHoverContent>
                  {isSectionOpen ? "Collapse" : "Expand"}
                </BadgeHoverContent>
              </HoverableBadge>
            ) : (
              <NavIcons>
                {challenge.videoUrl && (
                  <Tooltip2
                    usePortal={false}
                    position="left"
                    content="Includes Video"
                  >
                    <Icon
                      icon="video"
                      iconSize={IconSize.LARGE}
                      color={isDark ? COLORS.TEXT_CONTENT : COLORS.GRAY}
                    />
                  </Tooltip2>
                )}
              </NavIcons>
            )}
          </span>
        </ChallengeLink>
        {this.renderChallengeCodepressButton(course, module, index)}
      </ChallengeNavigationItem>
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

    // Do not render outside of Codepress
    if (!isEditMode) {
      return null;
    }

    return (
      <div style={{ position: "relative" }}>
        <AddNavItemPositionContainer>
          <Popover2
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
          </Popover2>
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
      challenge: generateEmptyChallenge({
        id: course.id,
        overwrite: overrides,
      }),
    });
  };

  handleClose = () => {
    if (this.props.overlayVisible) {
      this.props.setNavigationMapState(false);
    }
  };

  handleClickChallenge =
    (userCanAccess: boolean, courseId: string) => (event: any) => {
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

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
`;

interface AddNavItemButtonProps {
  onClick: () => any;
  show: boolean;
}

const AddNavItemButton = styled(({ show, ...props }: AddNavItemButtonProps) => {
  return <button {...props}>+</button>;
})`
  transform: translate(-50%, -50%) scale(${(props) => (props.show ? 1 : 0)});
  transition: all 0.15s ease-out;
  font-weight: bold;
  font-size: 12px;
  outline: none;
  cursor: pointer;
  border-radius: 100px;
  &:hover {
    transform: translate(-50%, -50%) scale(1.3);
  }
`;

interface ChallengeLinkProps extends NavLinkProps {
  locked: "true" | "false"; // To circumvent a React DOM attribute warning message...
  active?: boolean;
  selected: boolean;
  challenge_modified: "true" | "false"; // See above
}

const ChallengeLink = styled(NavLink)<ChallengeLinkProps>`
  cursor: pointer;
  padding: 12px;
  border: 1px solid transparent;

  border-bottom-color: ${(props: IThemeProps) => {
    return props.theme.dark ? COLORS.LIGHT_GREY : COLORS.NAV_LIGHT_BORDER;
  }};

  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  outline: none;
  position: relative;

  color: ${(props: IThemeProps & ChallengeLinkProps) => {
    if (props.challenge_modified === "true") {
      return COLORS.TEXT_DARK;
    }

    if (props.selected) {
      return props.theme.dark ? COLORS.TEXT_WHITE : COLORS.TEXT_LIGHT_THEME;
    } else {
      return props.theme.dark ? COLORS.TEXT_TITLE : COLORS.TEXT_LIGHT_THEME;
    }
  }} !important;

  background: ${(props: IThemeProps & ChallengeLinkProps) => {
    if (props.challenge_modified === "true") {
      return COLORS.SECONDARY_YELLOW;
    }

    if (props.selected) {
      return props.theme.dark
        ? COLORS.BACKGROUND_NAVIGATION_ITEM_HOVER_DARK
        : COLORS.BACKGROUND_NAVIGATION_ITEM_HOVER_LIGHT;
    } else {
      return "transparent";
    }
  }};

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
    background: ${(props) =>
      props.locked === "true" ? "rgb(135,135,135)" : COLORS.GRADIENT_GREEN};
  }

  &.active {
    color: ${(props: IThemeProps & ChallengeLinkProps) => {
      if (props.challenge_modified === "true") {
        return COLORS.TEXT_DARK;
      }

      return props.theme.dark ? COLORS.TEXT_WHITE : undefined;
    }} !important;

    background: ${(props: IThemeProps & ChallengeLinkProps) => {
      if (props.challenge_modified === "true") {
        return COLORS.SECONDARY_YELLOW;
      }

      return props.theme.dark
        ? COLORS.BACKGROUND_MODAL_DARK
        : COLORS.BACKGROUND_MODAL_LIGHT;
    }};

    &:after {
      transform: scale(1);
    }
  }

  .content {
    font-size: 18px;
    display: flex;
    align-items: center;
  }

  @media ${MOBILE} {
    .content span {
      max-width: 60vw;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &:hover {
    ${defaultTextColor};
    background: ${(props) => {
      if (props.challenge_modified === "true") {
        return undefined;
      }

      return props.theme.dark
        ? COLORS.BACKGROUND_NAVIGATION_ITEM_HOVER_DARK
        : COLORS.BACKGROUND_NAVIGATION_ITEM_HOVER_LIGHT;
    }};

    &:after {
      transform: scale(1);
    }
  }

  .iconComplete {
    color: ${COLORS.NEON_GREEN} !important;
  }

  .iconIncomplete {
    color: ${COLORS.SECONDARY_YELLOW} !important;
  }
`;

interface ModuleNavProps {
  active?: boolean;
  menu_selected: boolean;
}

const ModuleNavigationButtonBase = styled(ModuleNavigationBase)<ModuleNavProps>`
  outline: none;
  color: ${({ active, menu_selected }) =>
    active || menu_selected ? "white" : COLORS.TEXT_TITLE};

  color: ${(props: IThemeProps & ModuleNavProps) => {
    if (props.active || props.menu_selected) {
      return props.theme.dark ? COLORS.TEXT_WHITE : COLORS.TEXT_LIGHT_THEME;
    } else {
      return props.theme.dark ? COLORS.TEXT_TITLE : COLORS.TEXT_LIGHT_THEME;
    }
  }};

  background: ${(props: IThemeProps & ModuleNavProps) => {
    if (props.active) {
      return props.theme.dark
        ? COLORS.BACKGROUND_MODAL_DARK
        : COLORS.BACKGROUND_MODAL_LIGHT;
    } else if (props.menu_selected) {
      return props.theme.dark
        ? COLORS.BACKGROUND_NAVIGATION_ITEM_HOVER_DARK
        : COLORS.BACKGROUND_NAVIGATION_ITEM_HOVER_LIGHT;
    } else {
      return "transparent";
    }
  }};

  &:hover {
    background: ${(props: IThemeProps & ModuleNavProps) => {
      return props.theme.dark
        ? COLORS.BACKGROUND_NAVIGATION_ITEM_HOVER_DARK
        : COLORS.BACKGROUND_NAVIGATION_ITEM_HOVER_LIGHT;
    }};

    ${defaultTextColor};

    &:after {
      transform: scale(1);
    }
  }
`;

const ModuleNavigationButton = ({
  active,
  menu_selected,
  ...rest
}: { active?: boolean; menu_selected: boolean } & any) => (
  <ModuleNavigationButtonBase
    as="button"
    active={active}
    menu_selected={menu_selected}
    {...rest}
  />
);

interface ChallengeListItemIconProps {
  index: number;
  isMobile: boolean;
  isSectionOpen?: boolean;
  challenge: ChallengeSkeleton;
  challengeProgress: CHALLENGE_PROGRESS;
  onClick: (e: React.MouseEvent) => any;
}

const ChallengeListItemIcon = ({
  index,
  isMobile,
  challenge,
  isSectionOpen,
  challengeProgress,
  ...props
}: ChallengeListItemIconProps) => {
  let tooltipContent = "";
  let iconExtraClass = "";

  if (challengeProgress === "COMPLETE") {
    tooltipContent = "Challenge Completed";
    iconExtraClass = "iconComplete";
  } else if (challengeProgress === "INCOMPLETE") {
    tooltipContent = "Challenge Attempted";
    iconExtraClass = "iconIncomplete";
  }

  const isSection = challenge.type === "section";

  // Render a different label for sections to indicate
  // the expand|collapse functionality of clicking the icon
  if (isSection) {
    if (isSectionOpen) {
      tooltipContent = "Collapse Section";
    } else {
      tooltipContent = "Expand Section";
    }
  }

  if (!challenge.userCanAccess) {
    tooltipContent = "You must purchase the course to access this challenge.";
  }

  const icon = getChallengeIcon(
    challenge.type,
    challenge.userCanAccess,
    challengeProgress,
  );

  return (
    <Tooltip2
      content={tooltipContent}
      disabled={
        isMobile || (!isSection && challengeProgress === "NOT_ATTEMPTED")
      }
    >
      <RotatingIcon
        icon={icon}
        isRotated={isSectionOpen}
        iconSize={IconSize.LARGE}
        id={`challenge-${index}-icon-${challengeProgress}`}
        className={challenge.type !== "section" ? iconExtraClass : ""}
        {...props}
      />
    </Tooltip2>
  );
};

// The shadow that appears in the overlay nav for separating the module column
// from the challenge column
const SpecialLeftShadow = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 3;
  box-shadow: rgba(0, 0, 0, 0.22) 10px 0px 10px 0px inset;
  width: 80px;
  pointer-events: none;
`;

const BadgeDefaultContent = styled.span`
  display: inline-block;
  position: relative;
  transform: translateY(0);
  transition: all 0.4s ease;
`;

const BadgeHoverContent = styled.span`
  display: block;
  position: absolute;
  transition: all 0.2s ease;
  transform: translateY(200%);
  top: 50%;
  left: 0;
  right: 0;
  text-align: center;
`;

const HoverableBadge = styled.div`
  border-radius: 100px;
  font-size: 11px;
  font-weight: bold;
  padding: 4px 12px;
  position: relative;
  overflow: hidden;

  ${themeColor("background", "#505052", "rgb(175,175,175)")};

  @media ${MOBILE} {
    display: none;
  }

  &:hover {
    ${BadgeDefaultContent} {
      transform: translateY(-200%);
    }
    ${BadgeHoverContent} {
      transform: translateY(-50%);
    }
  }
`;

const ChallengeNavigationItem = styled.div`
  @media ${MOBILE} {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Col = styled.div<{ offsetX: number }>`
  display: flex;
  flex-direction: column;
  width: 300px;

  background: ${(props: IThemeProps) => {
    return props.theme.dark
      ? COLORS.BACKGROUND_CONTENT_DARK
      : COLORS.BACKGROUND_CONTENT_LIGHT;
  }};

  border-right: ${(props: IThemeProps) => {
    const color = props.theme.dark
      ? COLORS.LIGHT_GREY
      : COLORS.NAV_LIGHT_BORDER;
    return `1px solid ${color}`;
  }};

  position: relative;
  z-index: 2;
  transition: all 0.2s ease-out;
  transform: translateX(${({ offsetX }) => `${offsetX}px`});

  &.challenge-select {
    width: 600px;
  }

  @media ${MOBILE} {
    ${ModuleNavigationBase} {
      white-space: nowrap;
    }

    &.challenge-select {
      width: 90vw;
    }

    .mobile-shrink {
      transition: all 0.2s ease-out;
    }

    &.open {
      .mobile-shrink {
        .bp3-button-text {
          width: 100%;
          overflow: visible;
        }
      }
    }

    &.module-select {
      // Use the 0vw trick to make sure animations are smooth
      max-width: 100%;
      min-width: 50px;
      width: 0vw;
      flex-shrink: 0;

      &.open {
        width: 90vw;
      }

      ${ModuleNumber} {
        margin-right: 12px;
      }
    }
  }
`;

const ColScroll = styled.div`
  overflow: auto;
`;

const Overlay = styled.div<{ visible: boolean }>`
  top: ${HEADER_HEIGHT}px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 15;
  position: fixed;
  ${themeColor(
    "background",
    "rgba(0, 0, 0, 0.85)",
    "rgba(235, 235, 235, 0.85)",
  )}
  visibility: ${(props) => (props.visible ? "visible" : "hidden")};
  opacity: ${(props) => (props.visible ? "1" : "0")};
  pointer-events: ${(props) => (props.visible ? "all" : "none")};
  display: flex;
  transition: all 0.2s ease-out;
`;

const ColTitle = styled.div`
  font-size: 18px;
  font-weight: 200;
  margin: 0;
  height: 40px;
  padding: 0 12px;
  font-variant: small-caps;
  font-weight: bold;
  letter-spacing: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-grow: 0;
  flex-shrink: 0;

  ${defaultTextColor};

  ${themeColor(
    "background",
    COLORS.BACKGROUND_NAVIGATION_ITEM_DARK,
    COLORS.BACKGROUND_NAVIGATION_ITEM_LIGHT,
  )}

  p {
    margin: 0;
  }

  &.course-select {
    padding: 0 6px;

    .bp3-popover-wrapper,
    .bp3-popover-target {
      width: 100%;
    }
  }

  @media ${MOBILE} {
    &.course-select {
      display: flex;
      justify-content: center;
    }
    .mobile-shrink {
      .bp3-icon {
        color: ${(props: IThemeProps) => {
          return props.theme.dark ? "white" : COLORS.TEXT_LIGHT_THEME;
        }};
      }
      .bp3-button-text {
        width: 0%;
        margin: 0;
        overflow: hidden;
      }
    }
  }
`;

const ClickableColTitle = styled(ColTitle)<{ disabled: boolean }>`
  border-left: ${(props) =>
    props.disabled
      ? `3px solid ${COLORS.NEON_GREEN}`
      : `3px solid ${
          props.theme.dark
            ? COLORS.BACKGROUND_NAVIGATION_ITEM_DARK
            : COLORS.BACKGROUND_NAVIGATION_ITEM_LIGHT
        }`};

  :hover {
    cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};

    background: ${(props: IThemeProps & { disabled: boolean }) => {
      if (props.disabled) {
        return props.theme.dark
          ? COLORS.BACKGROUND_NAVIGATION_ITEM_DARK
          : COLORS.BACKGROUND_NAVIGATION_ITEM_LIGHT;
      } else {
        return props.theme.dark
          ? COLORS.BACKGROUND_NAVIGATION_ITEM_HOVER_DARK
          : COLORS.BACKGROUND_NAVIGATION_ITEM_HOVER_LIGHT;
      }
    }};
  }
`;

const NavIcons = styled.span`
  display: inline-block;

  & > span:not(:first-child) {
    margin-left: 10px;
  }
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const ChallengeSelectors = Modules.selectors.challenges;
const ChallengeActions = Modules.actions.challenges;

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  userProgress: Modules.selectors.user.userProgress(state),
  isEditMode: ChallengeSelectors.isEditMode(state),
  challengeId: ChallengeSelectors.getCurrentChallengeId(state),
  // NOTE: These are the module and course for the current navigation
  // overlay view state, not the active challenge.
  module: ChallengeSelectors.getCurrentNavigationOverlayModule(state),
  loadingAnimationComplete:
    Modules.selectors.app.loadingAnimationComplete(state),
  course: ChallengeSelectors.getCurrentNavigationOverlayCourseSkeleton(state),
  menuSelectState: ChallengeSelectors.menuSelectState(state),
  menuSelectColumn: ChallengeSelectors.menuSelectColumn(state),
  courseListMetadata: ChallengeSelectors.courseListMetadata(state),
  overlayVisible: ChallengeSelectors.navigationOverlayVisible(state),
  pullRequestChallengeIds: ChallengeSelectors.pullRequestChallengeIds(state),
  navigationAccordionViewState:
    ChallengeSelectors.getNavigationSectionAccordionViewState(state),
});

const dispatchProps = {
  setCurrentModule: ChallengeActions.setCurrentModule,
  setCurrentCourse: ChallengeActions.setCurrentCourse,
  setNavigationOverlayCurrentCourse:
    ChallengeActions.setNavigationOverlayCurrentCourse,
  setNavigationOverlayCurrentModule:
    ChallengeActions.setNavigationOverlayCurrentModule,
  createCourseModule: ChallengeActions.createCourseModule,
  updateCourseModule: ChallengeActions.updateCourseModule,
  deleteCourseModule: ChallengeActions.deleteCourseModule,
  createChallenge: ChallengeActions.createChallenge,
  deleteChallenge: ChallengeActions.deleteChallenge,
  reorderChallengeList: ChallengeActions.reorderChallengeList,
  reorderModuleList: ChallengeActions.reorderModuleList,
  setNavigationMapState: ChallengeActions.setNavigationMapState,
  toggleSectionAccordionView: ChallengeActions.toggleSectionAccordionView,
  handlePaymentCourseIntent: Modules.actions.payments.handlePaymentCourseIntent,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface ComponentProps {
  isMobile: boolean;
}

type IProps = ConnectProps & ComponentProps & RouteComponentProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(NavigationOverlay);
