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
      if (menuSelectColumn === "modules") {
        return course.modules;
      } else {
        return course.modules.find(
          (x) => x.id === currentActiveIds.currentModuleId,
        )?.challenges;
      }
    }

    return null;
  };

  // Return the index of the currently selected item
  getDefaultMenuItemIndex = (
    currentList: ModuleSkeletonList | ChallengeSkeletonList | null | undefined,
    // The direction is used to determine when to record the inCollapsedSection
    // state... only "up" and "down" are relevant
    direction: "up" | "down" | "left" | "right",
  ) => {
    if (!currentList) {
      return { currentIndex: 0, inCollapsedSection: false };
    }

    const {
      currentActiveIds,
      menuSelectState,
      menuSelectColumn,
      navigationAccordionViewState,
    } = this.props;
    const { menuSelectIndexChallenges, menuSelectIndexModules } =
      menuSelectState;
    const { currentChallengeId, currentModuleId } = currentActiveIds;

    let inCollapsedSection = false;

    // Try to default to the currently selected module or challenge
    let index;
    if (menuSelectColumn === "modules") {
      const targetId =
        menuSelectIndexModules === null
          ? currentModuleId
          : menuSelectIndexModules;
      if (targetId) {
        for (let i = 0; i < currentList.length; i++) {
          if (currentList[i].id === targetId) {
            index = i;
            break;
          }
        }
      }
    } else {
      // Default to challenge id
      let id = currentChallengeId;

      // Override with menuSelectIndexChallenges challenge id, if possible
      if (menuSelectIndexChallenges !== null) {
        const selectedItem = currentList[menuSelectIndexChallenges];
        id = selectedItem.id;
      }

      if (id) {
        for (let i = 0; i < currentList.length; i++) {
          const item = currentList[i];
          if (direction === "down") {
            if ("type" in item && item.type === "section") {
              inCollapsedSection =
                navigationAccordionViewState[item.id] === false;
            }
          }

          // Current item is the selected/active challenge
          if (item.id === id) {
            index = i;
            break;
          }

          if (direction === "up") {
            if ("type" in item && item.type === "section") {
              inCollapsedSection =
                navigationAccordionViewState[item.id] === false;
            }
          }
        }
      }
    }

    const currentIndex = !!index ? index : 0;

    // If challenges are selected and the current index is 0, iterate
    // backwards from the end of the list up to determine if we are
    // currently in a collapsed section or not.
    if (menuSelectColumn === "challenges") {
      if (currentIndex === 0) {
        for (let i = currentList.length - 1; i > 0; i--) {
          const possibleSection = currentList[i];
          if ("type" in possibleSection && possibleSection.type === "section") {
            inCollapsedSection =
              navigationAccordionViewState[possibleSection.id] === false;
            break;
          }
        }
      }
    }

    return { currentIndex, inCollapsedSection };
  };

  handleSelectMenuLeft = () => {
    const { menuSelectState, setMenuSelectColumn, setMenuSelectIndex } =
      this.props;

    setMenuSelectColumn("modules");
    const currentList = this.getCurrentModuleOrChallengeList();

    // Only initialize if not already set
    if (menuSelectState.menuSelectIndexModules === null) {
      const { currentIndex } = this.getDefaultMenuItemIndex(
        currentList,
        "left",
      );
      setMenuSelectIndex({ modules: currentIndex });
    }
  };

  handleSelectMenuRight = () => {
    const { setMenuSelectColumn, menuSelectState, setMenuSelectIndex } =
      this.props;

    setMenuSelectColumn("challenges");
    const currentList = this.getCurrentModuleOrChallengeList();

    // Only initialize if not already set
    if (menuSelectState.menuSelectIndexModules === null) {
      const { currentIndex } = this.getDefaultMenuItemIndex(
        currentList,
        "right",
      );
      setMenuSelectIndex({ challenges: currentIndex });
    }
  };

  handleSelectMenuUp = (e: KeyboardEvent) => {
    if (this.props.overlayVisible) {
      const { menuSelectState, setMenuSelectIndex, menuSelectColumn } =
        this.props;
      const { selectedIndex } = menuSelectState;
      const relevantList = this.getCurrentModuleOrChallengeList();

      // No action if the list doesn't exist
      if (!relevantList) {
        return;
      }

      const { currentIndex, inCollapsedSection } = this.getDefaultMenuItemIndex(
        relevantList,
        "up",
      );

      let TARGET_INDEX;

      // If we are in a collapsed section we want to search for the next
      // section to select
      if (inCollapsedSection) {
        let nextSectionIndex = null;
        let index = currentIndex - 1;
        while (nextSectionIndex === null) {
          // After the first item, reset back to the last item
          if (index === 0) {
            nextSectionIndex = 0;
          } else if (index === -1) {
            index = relevantList.length;
          } else {
            const nextItem = relevantList[index];
            // Next item is a section, this is what we want
            if (nextItem && "type" in nextItem && nextItem.type === "section") {
              nextSectionIndex = index;
              break;
            }
          }

          index--;
        }

        TARGET_INDEX = nextSectionIndex;
      } else if (selectedIndex === null) {
        // Default is up or down one from current default index, which is
        // the selected challenge or 0
        if (currentIndex === 0) {
          TARGET_INDEX = relevantList.length - 1;
        } else {
          TARGET_INDEX = currentIndex - 1;
        }
      } else if (selectedIndex === 0) {
        TARGET_INDEX = relevantList.length - 1;
      } else {
        TARGET_INDEX = selectedIndex - 1;
      }

      setMenuSelectIndex({ [menuSelectColumn]: TARGET_INDEX });
    }
  };

  handleSelectMenuDown = () => {
    if (this.props.overlayVisible) {
      const { menuSelectState, setMenuSelectIndex, menuSelectColumn } =
        this.props;
      const { selectedIndex } = menuSelectState;
      const relevantList = this.getCurrentModuleOrChallengeList();

      // No action if the list doesn't exist
      if (!relevantList) {
        return;
      }

      const { currentIndex, inCollapsedSection } = this.getDefaultMenuItemIndex(
        relevantList,
        "down",
      );

      let TARGET_INDEX;

      // If we are in a collapsed section we want to search for the next
      // section to select
      if (inCollapsedSection) {
        let nextSectionIndex = null;
        let index = currentIndex + 1;
        while (nextSectionIndex === null) {
          // After reaching the last item, reset index to the start of the list
          if (index === relevantList.length - 1) {
            nextSectionIndex = 0;
          } else {
            const nextItem = relevantList[index];
            // Next item is a section, this is what we want
            if (nextItem && "type" in nextItem && nextItem.type === "section") {
              nextSectionIndex = index;
            }
          }

          index++;
        }

        TARGET_INDEX = nextSectionIndex;
      } else if (selectedIndex === null) {
        // Default is up or down one from current default index, which is
        // the selected challenge or 0
        if (currentIndex === relevantList.length - 1) {
          TARGET_INDEX = 0;
        } else {
          TARGET_INDEX = currentIndex + 1;
        }
      } else if (selectedIndex === relevantList.length - 1) {
        TARGET_INDEX = 0;
      } else {
        TARGET_INDEX = selectedIndex + 1;
      }

      setMenuSelectIndex({ [menuSelectColumn]: TARGET_INDEX });
    }
  };

  handleSelectMenuItem = () => {
    const {
      overlayVisible,
      menuSelectState,
      menuSelectColumn,
      currentActiveIds,
      toggleSectionAccordionView,
      navigationAccordionViewState,
    } = this.props;
    const { currentModuleId } = currentActiveIds;
    const { selectedIndex } = menuSelectState;

    if (!overlayVisible || selectedIndex === null) {
      return;
    }

    const relevantList = this.getCurrentModuleOrChallengeList();

    // Nothing to do if there is no list
    if (!relevantList) {
      return;
    }

    if (menuSelectColumn === "modules") {
      const moduleItem = relevantList[selectedIndex];
      if (!!moduleItem && moduleItem.id !== currentModuleId) {
        // Need to reset the challenges menu select index when selecting a new
        // module, and switch the menu select column to challenges
        this.props.setMenuSelectIndex({ challenges: null });
        this.props.setCurrentModule(moduleItem.id);
        this.props.setMenuSelectColumn("challenges");
      }
    } else {
      const challenge = relevantList[selectedIndex];
      if (!challenge) {
      } else if (!challenge.userCanAccess) {
        toaster.warn("You must purchase the course to access this challenge.");
      } else if (navigationAccordionViewState[challenge.id] === false) {
        // If section is collapsed, expand it
        toggleSectionAccordionView({ sectionId: challenge.id, open: true });
      } else {
        // Otherwise, select the current challenge
        const id = `challenge-navigation-${selectedIndex}`;
        const element = document.getElementById(id);
        if (element) {
          element.click();
        }
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
  menuSelectState: Modules.selectors.challenges.menuSelectState(state),
  menuSelectColumn: Modules.selectors.challenges.menuSelectColumn(state),
  courseSkeletons: Modules.selectors.challenges.courseSkeletons(state),
  currentActiveIds: Modules.selectors.challenges.getCurrentActiveIds(state),
  nextPrevChallengeIds: Modules.selectors.challenges.nextPrevChallenges(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
  navigationAccordionViewState:
    Modules.selectors.challenges.getNavigationSectionAccordionViewState(state),
});

const dispatchProps = {
  updateUserSettings: Modules.actions.user.updateUserSettings,
  setCurrentModule: Modules.actions.challenges.setCurrentModule,
  setMenuSelectIndex: Modules.actions.challenges.setMenuSelectIndex,
  setMenuSelectColumn: Modules.actions.challenges.setMenuSelectColumn,
  setNavigationMapState: Modules.actions.challenges.setNavigationMapState,
  toggleSectionAccordionView:
    Modules.actions.challenges.toggleSectionAccordionView,
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
