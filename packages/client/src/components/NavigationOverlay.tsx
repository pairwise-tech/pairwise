import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";

import { Challenge } from "@prototype/common";
import Modules, { ReduxStoreState } from "modules/root";
import { COLORS } from "tools/constants";
import { composeWithProps } from "tools/utils";

const debug = require("debug")("client:NavigationOverlay");

/** ===========================================================================
 * React Class
 * ============================================================================
 */

class NavigationOverlay extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const { course, module, challengeId } = this.props;

    if (!course || !module) {
      debug("[INFO] No module or course", course, module);
      return null;
    }

    return (
      <Overlay visible={this.props.overlayVisible}>
        <Col>
          <Title>{course.title}</Title>
          {course.modules.map((m, i) => {
            return (
              <NavButton
                active={m.id === module.id}
                onClick={() => console.log(`[INFO] Select module ${m.id}`)}
              >
                <ModuleNumber>{i + 1}</ModuleNumber>
                {m.title}
              </NavButton>
            );
          })}
        </Col>
        <Col
          style={{
            boxShadow: "inset 20px 0px 20px 0px rgba(0, 0, 0, 0.1)",
          }}
        >
          {module.challenges.map((c: Challenge, i: number) => {
            return (
              <NavButton
                active={c.id === challengeId}
                key={c.id}
                onClick={() => this.props.selectChallenge(c.id)}
              >
                {c.title}
              </NavButton>
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

const ModuleNumber = styled.code`
  display: inline-block;
  padding: 5px;
  color: #ea709c;
  background: #3a3a3a;
  width: 24px;
  text-align: center;
  line-height: 24px;
  border-radius: 4px;
  box-shadow: inset 0px 0px 2px 0px #ababab;
  margin-right: 5px;
`;

const NavButton = styled.button<{ active?: boolean }>`
  background: ${props => (props.active ? "red" : "black")};
  cursor: pointer;
  padding: 12px;
  font-size: 18px;
  border-color: transparent;
  width: 100%;
  display: block;
  text-align: left;
  color: ${({ active }) => (active ? "white" : COLORS.TEXT_TITLE)};
  background: ${({ active }) =>
    active ? COLORS.BACKGROUND_MODAL : "transparent"};
  position: relative;

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

const Col = styled.div`
  display: block;
  width: 300px;
  background: ${COLORS.BACKGROUND_CONTENT};
  border-right: 1px solid ${COLORS.SEPARATOR_BORDER};
`;

const Overlay = styled.div<{ visible: boolean }>`
  width: 100%;
  height: 100%;
  z-index: 100;
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
