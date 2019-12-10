import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";

import Modules, { ReduxStoreState } from "modules/root";
import { composeWithProps } from "tools/utils";
import { Button } from "./Primitives";

/** ===========================================================================
 * React Class
 * ============================================================================
 */

class NavigationOverlay extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const { navigationSkeleton } = this.props;

    if (!navigationSkeleton) {
      return null;
    }

    const course = navigationSkeleton[0];

    return (
      <Overlay visible={this.props.overlayVisible}>
        {course.courseContent.challengeContent.map(c => {
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
  padding: 25px;
  position: absolute;
  background: rgba(0, 0, 0, 0.85);
  visibility: ${(props: { visible: boolean }) =>
    props.visible ? "visible" : "hidden"};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  navigationSkeleton: Modules.selectors.challenges.navigationSkeleton(state),
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
