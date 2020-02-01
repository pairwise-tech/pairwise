import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import {
  ChallengeSkeleton,
  CourseSkeleton,
  ModuleSkeleton,
  Challenge,
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
  Popover,
  Menu,
  MenuItem,
  Position,
  ContextMenu,
} from "@blueprintjs/core";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { NavLink, NavLinkProps } from "react-router-dom";
import { DEV_MODE } from "tools/client-env";

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
    const {
      course,
      module,
      challengeId,
      isEditMode,
      updateCourseModule,
    } = this.props;

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
          {course.modules.map((m, i) => {
            return (
              <div key={m.id} style={{ position: "relative" }}>
                {DEV_MODE ? (
                  isEditMode ? (
                    <ModuleCodepressContextMenu>
                      <NavUpdateField
                        onChange={e => {
                          updateCourseModule({
                            id: m.id,
                            courseId: course.id,
                            module: { title: e.target.value },
                          });
                        }}
                        defaultValue={m.title}
                      />
                    </ModuleCodepressContextMenu>
                  ) : (
                    <ModuleCodepressContextMenu>
                      {this.renderModuleNavigationItem(module.id, m, i)}
                    </ModuleCodepressContextMenu>
                  )
                ) : (
                  this.renderModuleNavigationItem(module.id, m, i)
                )}
                {this.renderModuleCodepressButton(course, i)}
              </div>
            );
          })}
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
          <div style={{ position: "relative" }}>
            {this.renderChallengeCodepressButton(course, module, -1)}
          </div>
          {module.challenges.map((c: ChallengeSkeleton, i: number) => {
            return (
              <div key={c.id} style={{ position: "relative" }}>
                <Link
                  key={c.id}
                  to={`/workspace/${c.id}`}
                  id={`challenge-navigation-${i}`}
                  isActive={() => c.id === challengeId}
                  onClick={this.handleClickChallenge(
                    c.userCanAccess,
                    course.id,
                  )}
                >
                  <span>
                    <Icon
                      iconSize={Icon.SIZE_LARGE}
                      icon={getChallengeIcon(c.type, c.userCanAccess)}
                    />
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
                {this.renderChallengeCodepressButton(course, module, i)}
              </div>
            );
          })}
          <DoneScrolling />
        </Col>
      </Overlay>
    );
  }

  renderModuleNavigationItem = (
    activeModuleId: string,
    module: ModuleSkeleton,
    index: number,
  ) => {
    return (
      <NavButton
        id={`module-navigation-${index}`}
        active={module.id === activeModuleId}
        onClick={() => this.props.setCurrentModule(module.id)}
      >
        <span>
          <ModuleNumber>{index}</ModuleNumber>
          {module.title}
        </span>
      </NavButton>
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

class ModuleCodepressContextMenu extends React.PureComponent<
  {},
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
    ContextMenu.show(
      <Menu>
        <MenuItem onClick={() => null} text="Edit" />
        <MenuItem onClick={() => null} text="Delete" />
      </Menu>,
      { left: e.clientX, top: e.clientY },
      () => this.setState({ isContextMenuOpen: false }),
    );

    this.setState({ isContextMenuOpen: true });
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
  padding: 12px;
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

const NavButton = styled.button<{ active?: boolean }>`
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
  color: ${({ active }) => (active ? "white" : COLORS.TEXT_TITLE)};
  background: ${({ active }) =>
    active ? COLORS.BACKGROUND_MODAL : "transparent"};
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

  &:hover {
    color: white;
    background: #0d0d0d;
    &:after {
      transform: scale(1);
    }
  }
`;

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
});

const dispatchProps = {
  setCurrentModule: Modules.actions.challenges.setCurrentModule,
  createCourseModule: Modules.actions.challenges.createCourseModule,
  updateCourseModule: Modules.actions.challenges.updateCourseModule,
  createChallenge: Modules.actions.challenges.createChallenge,
  setNavigationMapState: Modules.actions.challenges.setNavigationMapState,
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
