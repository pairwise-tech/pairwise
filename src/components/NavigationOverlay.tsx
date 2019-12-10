import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";

import Modules, { ReduxStoreState } from "modules/root";
import { composeWithProps } from "tools/utils";

/** ===========================================================================
 * React Class
 * ============================================================================
 */

class NavigationOverlay extends React.Component<IProps, {}> {
  render(): JSX.Element {
    return <Overlay visible={this.props.overlayVisible}></Overlay>;
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
  position: absolute;
  background: rgba(0, 0, 0, 0.85);
  visibility: ${(props: { visible: boolean }) =>
    props.visible ? "visible" : "hidden"};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({});

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps & ComponentProps;

interface ComponentProps {
  overlayVisible: boolean;
}

const withProps = connect(null, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(NavigationOverlay);
