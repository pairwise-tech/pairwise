import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import {
  ChallengeSkeleton,
  CourseSkeleton,
  ModuleSkeleton,
  ModuleSkeletonList,
  CHALLENGE_PROGRESS,
  CourseMetadata,
} from "@pairwise/common";
import Modules, { ReduxStoreState } from "modules/root";
import { COLORS, MOBILE } from "tools/constants";
import { HEADER_HEIGHT } from "tools/dimensions";
import { composeWithProps } from "tools/utils";
import { Button } from "@blueprintjs/core";
import { NavLink, NavLinkProps, RouteComponentProps } from "react-router-dom";
import {
  ModuleNumber,
  ModuleNavigationBase,
} from "./AdminNavigationComponents";
import { Select } from "@blueprintjs/select";
import cx from "classnames";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const CourseSelect = Select.ofType<CourseMetadata>();

/** ===========================================================================
 * React Class
 * ============================================================================
 */

class AdminNavigationMenu extends React.Component<
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
    const {
      course,
      module,
      isMobile,
      overlayVisible,
      courseListMetadata,
    } = this.props;

    if (!course || !module) {
      console.warn(
        "[NAVIGATION OVERLAY WARNING] No module or course found! ->",
        course,
        module,
      );
      return null;
    }

    return (
      <Overlay visible={overlayVisible} onClick={this.handleClose}>
        <Col
          className={cx("module-select", { open: this.state.showModuleList })}
          style={{ zIndex: 3 }}
          offsetX={overlayVisible ? 0 : -20}
          onClick={e => e.stopPropagation()}
        >
          <ColTitle className="course-select">
            <CourseSelect
              filterable={false}
              items={courseListMetadata}
              itemDisabled={c => c.id === course.id}
              onItemSelect={({ id }) => null}
              itemRenderer={({ title, id }, { handleClick }) => (
                <ClickableColTitle
                  key={id}
                  disabled={id === course.id}
                  onClick={handleClick}
                >
                  {title}
                </ClickableColTitle>
              )}
            >
              <Button
                style={{ whiteSpace: "nowrap" }}
                fill
                className="mobile-shrink"
                text={course.title}
                rightIcon="chevron-down"
              />
            </CourseSelect>
          </ColTitle>
          <ColScroll>
            {this.renderSortableModuleList(course, module, course.modules)}
          </ColScroll>
        </Col>
        <Col
          className="challenge-select"
          offsetX={overlayVisible ? 0 : -60}
          style={{
            zIndex: 2,
          }}
          onClick={e => e.stopPropagation()}
        >
          <SpecialLeftShadow />
          <ColTitle>
            <p style={{ fontSize: isMobile ? 13 : 18 }}>{module.title}</p>
          </ColTitle>
          <ColScroll>
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
    return (
      <React.Fragment>
        <ModuleNavigationButton>
          <span>Users</span>
        </ModuleNavigationButton>
        <ModuleNavigationButton>
          <span>Payments</span>
        </ModuleNavigationButton>
      </React.Fragment>
    );
    // return moduleList.map((m, i) => {
    //   return this.renderModuleNavigationItem(module.id, m, i);
    // });
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
        // onClick={() => this.props.setCurrentModule(module.id)}
      >
        <span>
          <ModuleNumber>{index}</ModuleNumber>
          {module.title}
        </span>
      </ModuleNavigationButton>
    );
  };

  handleClose = () => {
    if (this.props.overlayVisible) {
      this.props.setNavigationMapState(false);
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

interface AddNavItemButtonProps {
  onClick: () => any;
  show: boolean;
}

interface ChallengeLinkProps extends NavLinkProps {
  locked: "true" | "false"; // To circumvent a React DOM attribute warning message...
  active?: boolean;
}

const ChallengeLink = styled(NavLink)<ChallengeLinkProps>`
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
    background: ${props =>
      props.locked === "true" ? "rgb(135,135,135)" : COLORS.GRADIENT_GREEN};
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

  @media ${MOBILE} {
    .content span {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      max-width: 60vw;
    }
  }

  &:hover {
    color: white !important;
    background: ${COLORS.BACKGROUND_NAVIGATION_ITEM_HOVER};
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

const ModuleNavigationButtonBase = styled(ModuleNavigationBase)<{
  active?: boolean;
}>`
  outline: none;
  color: ${({ active }) => (active ? "white" : COLORS.TEXT_TITLE)};
  background: ${({ active }) =>
    active ? COLORS.BACKGROUND_MODAL : "transparent"};

  &:hover {
    color: white;
    background: ${COLORS.BACKGROUND_NAVIGATION_ITEM_HOVER};
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

interface ChallengeListItemIconProps {
  index: number;
  challenge: ChallengeSkeleton;
  isSectionOpen?: boolean;
  challengeProgress: CHALLENGE_PROGRESS;
  onClick: (e: React.MouseEvent) => any;
}

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

const Col = styled.div<{ offsetX: number }>`
  display: flex;
  flex-direction: column;
  width: 300px;
  background: ${COLORS.BACKGROUND_CONTENT};
  border-right: 1px solid ${COLORS.LIGHT_GREY};
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
  background: rgba(0, 0, 0, 0.85);
  visibility: ${props => (props.visible ? "visible" : "hidden")};
  opacity: ${props => (props.visible ? "1" : "0")};
  pointer-events: ${props => (props.visible ? "all" : "none")};
  display: flex;
  transition: all 0.2s ease-out;
`;

const ColTitle = styled.div`
  font-size: 18px;
  font-weight: 200;
  color: white;
  margin: 0;
  height: 40px;
  padding: 0 12px;
  font-variant: small-caps;
  font-weight: bold;
  letter-spacing: 2;
  background: ${COLORS.BACKGROUND_NAVIGATION_ITEM};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-grow: 0;
  flex-shrink: 0;

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
      // Why is blueprint SO INSISTENT on their low-contrast icons?!?
      .bp3-icon {
        color: white !important;
      }
      .bp3-button-text {
        width: 0%;
        overflow: hidden;
        margin: 0;
      }
    }
  }
`;

const ClickableColTitle = styled(ColTitle)<{ disabled: boolean }>`
  border-left: ${props =>
    props.disabled
      ? `3px solid ${COLORS.NEON_GREEN}`
      : `3px solid ${COLORS.BACKGROUND_NAVIGATION_ITEM}`};

  :hover {
    cursor: ${props => (props.disabled ? "not-allowed" : "pointer")};
    background: ${props =>
      props.disabled
        ? COLORS.BACKGROUND_NAVIGATION_ITEM
        : COLORS.BACKGROUND_NAVIGATION_ITEM_HOVER};
  }
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  module: Modules.selectors.challenges.getCurrentModule(state),
  course: Modules.selectors.challenges.getCurrentCourseSkeleton(state),
  challengeId: Modules.selectors.challenges.getCurrentChallengeId(state),
  courseListMetadata: Modules.selectors.challenges.courseListMetadata(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
});

const ChallengeActions = Modules.actions.challenges;

const dispatchProps = {
  setNavigationMapState: ChallengeActions.setNavigationMapState,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps & ComponentProps & RouteComponentProps;

interface ComponentProps {
  isMobile: boolean;
}

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(AdminNavigationMenu);
