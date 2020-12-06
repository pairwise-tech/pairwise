import { connect } from "react-redux";
import { getChallengeSlug } from "@pairwise/common";
import Modules, { ReduxStoreState } from "modules/root";
import { COLORS, SANDBOX_ID } from "tools/constants";
import { composeWithProps } from "tools/utils";
import { withRouter, RouteComponentProps } from "react-router-dom";
import allPass from "ramda/es/allPass";
import React from "react";
import tap from "ramda/es/tap";
import difference from "ramda/es/difference";
import { Position, Popover, Tooltip } from "@blueprintjs/core";
import { IconButton } from "./AdminComponents";
import styled from "styled-components";
import { getClientOS } from "../tools/utils";

const debug = require("debug")("client:KeyboardShortcuts");

/** ===========================================================================
 * Keyboard Shortcuts
 * ============================================================================
 */

// Callback method for handling a keypress
type ShortcutKeyHandler = (e: KeyboardEvent) => any;

/**
 * This is the source of truth for shortcut key key combinations and their
 * intended action in the application.
 */
const SHORTCUT_KEYS = {
  "cmd+j": "Toggle Navigation Map",
  "cmd+p": "Focus Search Bar",
};

/**
 * Additional keys which we don't want to show as visible shortcuts,
 * for some reason, e.g. they are intuitive or their specific behavior
 * changes depending on the context.
 */
interface NonMappedKeys {
  escape: ShortcutKeyHandler;
}

/**
 * Type representing the valid shortcut key combinations which
 * exist.
 */
export type VALID_SHORTCUT_KEYS_MAP = {
  [key in keyof typeof SHORTCUT_KEYS]: ShortcutKeyHandler;
} &
  NonMappedKeys;

/**
 * NOTE: It's hard to type this, valid props also include the single
 * key whitelist below, in addition to the fixed key combinations
 * defined above...
 */
export interface KeyMapProps {
  [key: string]: ShortcutKeyHandler;
}

// Keyboard shortcut props
interface KeyboardShortcutsProps {
  keymap: KeyMapProps;
}

// NOTE: They should be lowercase
const singleKeyWhitelist = new Set([
  "escape",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "enter",
]);

type MetaKey = "shiftKey" | "ctrlKey" | "metaKey" | "altKey";

/** ===========================================================================
 * Component
 * ============================================================================
 */

const KeyboardShortcuts = ({ keymap }: KeyboardShortcutsProps) => {
  React.useEffect(() => {
    const metaMap: { [k: string]: MetaKey } = {
      shift: "shiftKey",
      ctrl: "ctrlKey",
      alt: "altKey",
      cmd: "metaKey",
    };

    const makePredicate = (commandString: string) => {
      const chars = commandString.split("+").map(x => x.toLowerCase());

      // Support mapping the whitelisted single chars. The whole whitelist thing
      // is meant ot prevent us from willy-nilly mapping single keys since that
      // can be very unexpected for users. When mapping a single key just keep
      // in mind that it might be best to map it contextually as opposed to all
      // the time.
      if (chars.length === 1 && singleKeyWhitelist.has(chars[0])) {
        return (e: KeyboardEvent) => {
          return e.key.toLowerCase() === chars[0];
        };
      }

      // If not in the whitelist require at least two keys
      if (chars.length < 2) {
        console.warn(
          "Keycode mappings must have at least 2 keys unless its one of the following",
          Array.from(singleKeyWhitelist),
        );
        return;
      }

      const charKey = chars[chars.length - 1]; // Last
      const charPred = (e: KeyboardEvent) => e.key.toLowerCase() === charKey;

      // All meta keys
      const meta = chars
        .slice(0, -1)
        .map(
          tap(x => {
            // Just some validation
            if (x === "option") {
              throw new Error(
                "[Err KeyboardShortcuts] 'option' key passed, expected 'alt'.",
              );
            }
            if (x === "command") {
              throw new Error(
                "[Err KeyboardShortcuts] 'command' key passed, expected 'cmd'.",
              );
            }
          }),
        )
        .map(x => metaMap[x])
        .filter(Boolean);
      // All meta keys not included in the sequence
      const inverseMeta = difference(Object.values(metaMap), meta);

      // Ensure all meta keys are pressed...
      const metaPred = meta.map((k: MetaKey) => (e: KeyboardEvent) => e[k]);
      // ... but NONE of the other meta keys are pressed. Example: 'cmd+shift+e' should NOT trigger 'cmd+e'
      const inverseMetaPred = inverseMeta.map(
        (k: MetaKey) => (e: KeyboardEvent) => !e[k],
      );

      return allPass([...metaPred, ...inverseMetaPred, charPred]);
    };

    const listeners = Object.keys(keymap).reduce(
      (agg: ShortcutKeyHandler[], commandString: string) => {
        // Typing complexity issue...
        const fn = keymap[commandString as keyof VALID_SHORTCUT_KEYS_MAP];
        const predicate = makePredicate(commandString);

        if (!predicate || !fn) {
          console.warn(
            `[INFO] Could not create key mapping for "${commandString}"`,
          );

          return agg;
        }

        return [...agg, (e: KeyboardEvent) => predicate(e) && fn(e)];
      },
      [],
    );

    debug("Setting up listeners");
    listeners.forEach(fn => {
      document.addEventListener("keydown", fn);
    });

    return () => {
      debug("Removing listeners");
      listeners.forEach(fn => {
        document.removeEventListener("keydown", fn);
      });
    };
  }, [keymap]);
  return null;
};

/** ===========================================================================
 * Keyboard Shortcut Popover
 * ============================================================================
 */

export const ShortcutKeysPopover = () => {
  /**
   * NOTE: Only provide the shortcuts on MacOS for now, until we implement
   * them on Windows/Linux.
   */
  const OS = getClientOS();
  if (OS !== "Mac") {
    return null;
  }

  return (
    <Popover
      usePortal={false}
      position={Position.BOTTOM}
      content={
        <ShortcutPopover>
          <ShortcutKeysTitle>Shortcut Keys</ShortcutKeysTitle>
          {Object.entries(SHORTCUT_KEYS).map(([shortcut, description]) => {
            return (
              <ShortcutKey key={shortcut}>
                <ShortcutText>
                  <Code>{shortcut}</Code>
                </ShortcutText>
                <DescriptionText>{description}</DescriptionText>
              </ShortcutKey>
            );
          })}
        </ShortcutPopover>
      }
    >
      <Tooltip usePortal={false} content="View Shortcut Keys" position="bottom">
        <IconButton icon="application" aria-label="view shortcut keys" />
      </Tooltip>
    </Popover>
  );
};

const ShortcutPopover = styled.div`
  padding: 18px;
  padding-left: 24px;
  padding-right: 24px;
`;

const ShortcutKey = styled.div`
  margin-top: 8px;
`;

const ShortcutText = styled.p`
  margin: 0;
`;

const Code = styled.code``;

const DescriptionText = styled.span`
  font-size: 10px;
  color: ${COLORS.TEXT_CONTENT};
`;

const ShortcutKeysTitle = styled.h3`
  margin: 0;
  padding-bottom: 4px;
  margin-bottom: 4px;
  border-bottom: 1px solid ${COLORS.TEXT_CONTENT};
`;

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
      "cmd+j": this.handleToggleNavigationMap,
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
  nextPrevChallengeIds: Modules.selectors.challenges.nextPrevChallenges(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
});

const dispatchProps = {
  setNavigationMapState: Modules.actions.challenges.setNavigationMapState,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps & ComponentProps & RouteComponentProps;

interface ComponentProps {}

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export { KeyboardShortcuts };

export default composeWithProps<ComponentProps>(withProps)(
  withRouter(GlobalKeyboardShortcuts),
);
