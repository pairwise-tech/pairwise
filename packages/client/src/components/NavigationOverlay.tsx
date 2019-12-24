import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";

import Modules, { ReduxStoreState } from "modules/root";
import { COLORS } from "tools/constants";
import { composeWithProps } from "tools/utils";
import { Button } from "./Primitives";

/** ===========================================================================
 * React Class
 * ============================================================================
 */

class NavigationOverlay extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const { courseList } = this.props;

    if (!courseList) {
      return null;
    }

    /* Just use the first (only) course! */
    const course = courseList[0];

    return (
      <Overlay visible={this.props.overlayVisible}>
        <Title>View another challenge:</Title>
        {course.modules[0].challenges.map(c => {
          return (
            <Button
              key={c.id}
              style={{ marginTop: 25, width: 250 }}
              onClick={() => this.props.selectChallenge(c.id)}
            >
              {c.title}
            </Button>
          );
        })}
      </Overlay>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const Overlay = styled.div`
  width: 100%;
  height: 100%;
  z-index: 100;
  padding-top: 25px;
  padding-left: 50px;
  position: fixed;
  background: rgba(0, 0, 0, 0.85);
  visibility: ${(props: { visible: boolean }) =>
    props.visible ? "visible" : "hidden"};
`;

const Title = styled.p`
  font-size: 18px;
  font-weight: 200;
  color: ${COLORS.TEXT_TITLE};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  courseList: Modules.selectors.challenges.courseList(state),
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
