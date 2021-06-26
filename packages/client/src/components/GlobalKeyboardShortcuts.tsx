import React from "react";
import { connect } from "react-redux";
import {
  ChallengeSkeletonList,
  getChallengeSlug,
  ModuleSkeletonList,
} from "@pairwise/common";
import Modules, { ReduxStoreState } from "modules/root";
import { SANDBOX_ID } from "tools/constants";
import { composeWithProps } from "tools/utils";
import KeyboardShortcuts, {
  VALID_SHORTCUT_KEYS_MAP,
  KeyMapProps,
} from "./KeyboardShortcuts";
import { withRouter, RouteComponentProps } from "react-router-dom";
import toaster from "../tools/toast-utils";

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
      enter: this.handleSelectMenuItem,
      arrowup: this.handleSelectMenuUp,
      arrowdown: this.handleSelectMenuDown,
      arrowleft: this.handleSelectMenuLeft,
      arrowright: this.handleSelectMenuRight,
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

  getCurrentModuleOrChallengeList = () => {
    const { courseSkeletons, currentActiveIds, menuSelectColumn } = this.props;
    const course = courseSkeletons?.find(
      (x) => x.id === currentActiveIds.currentCourseId,
    );
    if (course) {
      if (menuSelectColumn === "MODULE") {
        return course.modules;
      } else {
        return course.modules.find(
          (x) => x.id === currentActiveIds.currentModuleId,
        )?.challenges;
      }
    }

    return null;
  };

  getDefaultMenuItemIndex = (
    currentList: ModuleSkeletonList | ChallengeSkeletonList | null | undefined,
  ) => {
    if (!currentList) {
      return 0;
    }

    const { currentChallengeId, currentModuleId } = this.props.currentActiveIds;

    // Try to default to the currently selected module or challenge
    let index;
    if (this.props.menuSelectColumn === "MODULE") {
      if (currentModuleId) {
        for (let i = 0; i < currentList.length; i++) {
          if (currentList[i].id === currentModuleId) {
            index = i;
            break;
          }
        }
      }
    } else {
      if (currentChallengeId) {
        for (let i = 0; i < currentList.length; i++) {
          if (currentList[i].id === currentChallengeId) {
            index = i;
            break;
          }
        }
      }
    }

    return !!index ? index : 0;
  };

  handleSelectMenuItem = () => {
    const { overlayVisible, menuSelectIndex, menuSelectColumn } = this.props;

    if (!overlayVisible || menuSelectIndex === null) {
      return;
    }

    const relevantList = this.getCurrentModuleOrChallengeList();
    if (!relevantList) {
      return;
    }

    if (menuSelectColumn === "MODULE") {
      const module = relevantList[menuSelectIndex];
      if (!module) {
        return;
      }

      this.props.setCurrentModule(module.id);
    } else {
      const challenge = relevantList[menuSelectIndex];
      if (!challenge) {
        return;
      } else if (!challenge.userCanAccess) {
        toaster.warn("You must purchase the course to access this challenge.");
        return;
      }

      const id = `challenge-navigation-${menuSelectIndex}`;
      const element = document.getElementById(id);
      if (element) {
        element.click();
      }
    }
  };

  handleSelectMenuLeft = () => {
    this.props.setMenuSelectColumn("MODULE");
    this.props.setMenuSelectIndex(
      this.getDefaultMenuItemIndex(this.getCurrentModuleOrChallengeList()),
    );
  };

  handleSelectMenuRight = () => {
    this.props.setMenuSelectColumn("CHALLENGE");
    this.props.setMenuSelectIndex(0);
  };

  handleSelectMenuUp = (e: KeyboardEvent) => {
    if (this.props.overlayVisible) {
      const { menuSelectIndex, setMenuSelectIndex } = this.props;
      const relevantList = this.getCurrentModuleOrChallengeList();

      if (!relevantList) {
        return;
      }

      if (menuSelectIndex === null) {
        // Default is up or down one from current default index, which is
        // the selected challenge or 0
        const defaultSelection = this.getDefaultMenuItemIndex(relevantList);
        if (defaultSelection === 0) {
          setMenuSelectIndex(relevantList.length - 1);
        } else {
          setMenuSelectIndex(defaultSelection - 1);
        }
      } else if (menuSelectIndex === 0) {
        setMenuSelectIndex(relevantList.length - 1);
      } else {
        setMenuSelectIndex(menuSelectIndex - 1);
      }
    }
  };

  handleSelectMenuDown = () => {
    if (this.props.overlayVisible) {
      const { menuSelectIndex, setMenuSelectIndex } = this.props;
      const relevantList = this.getCurrentModuleOrChallengeList();

      if (!relevantList) {
        return;
      }

      if (menuSelectIndex === null) {
        // Default is up or down one from current default index, which is
        // the selected challenge or 0
        const defaultSelection = this.getDefaultMenuItemIndex(relevantList);
        if (defaultSelection === relevantList.length - 1) {
          setMenuSelectIndex(0);
        } else {
          setMenuSelectIndex(defaultSelection + 1);
        }
      } else if (menuSelectIndex === relevantList.length - 1) {
        setMenuSelectIndex(0);
      } else {
        setMenuSelectIndex(menuSelectIndex + 1);
      }
    }
  };
}

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  userSettings: Modules.selectors.user.userSettings(state),
  menuSelectIndex: Modules.selectors.challenges.menuSelectIndex(state),
  menuSelectColumn: Modules.selectors.challenges.menuSelectColumn(state),
  courseSkeletons: Modules.selectors.challenges.courseSkeletons(state),
  currentActiveIds: Modules.selectors.challenges.getCurrentActiveIds(state),
  nextPrevChallengeIds: Modules.selectors.challenges.nextPrevChallenges(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
});

const dispatchProps = {
  updateUserSettings: Modules.actions.user.updateUserSettings,
  setCurrentModule: Modules.actions.challenges.setCurrentModule,
  setMenuSelectIndex: Modules.actions.challenges.setMenuSelectIndex,
  setMenuSelectColumn: Modules.actions.challenges.setMenuSelectColumn,
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
