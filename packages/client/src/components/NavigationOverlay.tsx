import React from "react";
import { connect } from "react-redux";
import shortid from "shortid";
import styled from "styled-components/macro";

import { Challenge, Module } from "@pairwise/common";
import Modules, { ReduxStoreState } from "modules/root";
import { COLORS, HEADER_HEIGHT } from "tools/constants";
import { composeWithProps } from "tools/utils";
import { Tooltip, Icon } from "@blueprintjs/core";
import KeyboardShortcuts from "./KeyboardShortcuts";

const debug = require("debug")("client:NavigationOverlay");

const generateEmptyModule = (): Module => ({
  id: shortid.generate(),
  title: "[EMTPY...]",
  challenges: [],
});

const generateEmptyChallenge = (): Challenge => ({
  id: shortid.generate(),
  type: "markup",
  title: "[EMPTY...]",
  content: "",
  testCode: "// test('message', () => expect(...))",
  videoUrl: "",
  starterCode: "",
  solutionCode: "",
  supplementaryContent: "",
});

/** ===========================================================================
 * React Class
 * ============================================================================
 */

class NavigationOverlay extends React.Component<IProps, {}> {
  handleClose = () => {
    if (this.props.overlayVisible) {
      this.props.setNavigationMapState(false);
    }
  };

  render(): Nullable<JSX.Element> {
    const {
      course,
      module,
      challengeId,
      isEditMode,
      updateCourseModule,
      setCurrentModule,
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
          {course.modules.map((m, i) => {
            return (
              <div key={m.id} style={{ position: "relative" }}>
                {isEditMode ? (
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
                ) : (
                  <NavButton
                    active={m.id === module.id}
                    onClick={() => setCurrentModule(m.id)}
                  >
                    <span>
                      <ModuleNumber>{i + 1}</ModuleNumber>
                      {m.title}
                    </span>
                  </NavButton>
                )}
                <AddNavItemButton
                  show={isEditMode}
                  onClick={() =>
                    this.props.createCourseModule({
                      courseId: course.id,
                      insertionIndex: i + 1,
                      module: generateEmptyModule(),
                    })
                  }
                />
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
            <AddNavItemButton
              show={isEditMode}
              onClick={() =>
                this.props.createChallenge({
                  courseId: course.id,
                  moduleId: module.id,
                  insertionIndex: 0,
                  challenge: generateEmptyChallenge(),
                })
              }
            />
          </div>
          {module.challenges.map((c: Challenge, i: number) => {
            return (
              <div key={c.id} style={{ position: "relative" }}>
                <NavButton
                  active={c.id === challengeId}
                  key={c.id}
                  onClick={() => this.props.selectChallenge(c.id)}
                >
                  <span>
                    <Icon
                      iconSize={Icon.SIZE_LARGE}
                      icon={c.type === "media" ? "book" : "code"}
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
                </NavButton>
                <AddNavItemButton
                  show={isEditMode}
                  onClick={() =>
                    this.props.createChallenge({
                      courseId: course.id,
                      moduleId: module.id,
                      insertionIndex: i + 1,
                      challenge: generateEmptyChallenge(),
                    })
                  }
                />
              </div>
            );
          })}
        </Col>
      </Overlay>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

interface AddNavItemButtonProps {
  onClick: () => any;
  show: boolean;
}

const AddNavItemButton = styled(({ show, ...props }: AddNavItemButtonProps) => {
  return <button {...props}>+</button>;
})`
  position: absolute;
  z-index: 5;
  top: 100%;
  left: 50%;
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
  isEditMode: Modules.selectors.challenges.isEditMode(state),
  course: Modules.selectors.challenges.getCurrentCourse(state),
  module: Modules.selectors.challenges.getCurrentModule(state),
  challengeId: Modules.selectors.challenges.getCurrentChallengeId(state),
});

const dispatchProps = {
  selectChallenge: Modules.actions.challenges.setChallengeId,
  setCurrentModule: Modules.actions.challenges.setCurrentModule,
  createCourseModule: Modules.actions.challenges.createCourseModule,
  updateCourseModule: Modules.actions.challenges.updateCourseModule,
  createChallenge: Modules.actions.challenges.createChallenge,
  setNavigationMapState: Modules.actions.challenges.setNavigationMapState,
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
