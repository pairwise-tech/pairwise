import React from "react";
import { connect } from "react-redux";
import { getChallengeSlug } from "@pairwise/common";
import Modules, { ReduxStoreState } from "modules/root";
import { SANDBOX_ID } from "tools/constants";
import { composeWithProps } from "tools/utils";
import KeyboardShortcuts, {
  VALID_SHORTCUT_KEYS_MAP,
  KeyMapProps,
} from "./KeyboardShortcuts";
import { withRouter, RouteComponentProps } from "react-router-dom";

/** ===========================================================================
 * GlobalKeyboardShortcuts Class
 * ----------------------------------------------------------------------------
 * This provides global keyboard shortcuts for controlling various actions
 * throughout the app.
 * ============================================================================
 */

class GlobalKeyboardShortcuts extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    // Only valid key combinations are allowed for available shortcuts:
    const shortcutKeyMap: Partial<VALID_SHORTCUT_KEYS_MAP> = {
      escape: this.handleClose,
      "cmd+shift+k": this.navigateToSandBox,
      "cmd+j": this.handleToggleNavigationMap,
      "cmd+;": this.navigateLeft,
      "cmd+'": this.navigateRight,
      "cmd+/": this.props.toggleEditorSize,
    };

    return <KeyboardShortcuts keymap={shortcutKeyMap as KeyMapProps} />;
  }

  handleClose = () => {
    if (this.props.overlayVisible) {
      this.props.setNavigationMapState(false);
    }
  };

  handleToggleNavigationMap = () => {
    this.props.setNavigationMapState(!this.props.overlayVisible);
  };

  navigateLeft = (e: KeyboardEvent) => {
    const { prev } = this.props.nextPrevChallengeIds;

    if (prev) {
      const slug = getChallengeSlug(prev);
      this.props.history.push(`/workspace/${slug}`);
    }
  };

  navigateRight = (e: KeyboardEvent) => {
    const { next } = this.props.nextPrevChallengeIds;
    if (next) {
      const slug = getChallengeSlug(next);
      this.props.history.push(`/workspace/${slug}`);
    }
  };

  navigateToSandBox = () => {
    this.props.history.push(`/workspace/${SANDBOX_ID}`);
  };
}

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  userSettings: Modules.selectors.user.userSettings(state),
  nextPrevChallengeIds: Modules.selectors.challenges.nextPrevChallenges(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
});

const dispatchProps = {
  updateUserSettings: Modules.actions.user.updateUserSettings,
  setNavigationMapState: Modules.actions.challenges.setNavigationMapState,
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

type IProps = ConnectProps & ComponentProps & RouteComponentProps;

interface ComponentProps {}

const withProps = connect(mapStateToProps, dispatchProps, mergeProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(
  withRouter(GlobalKeyboardShortcuts),
);
