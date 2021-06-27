import React from "react";
import { Menu, MenuItem } from "@blueprintjs/core";
import { ContextMenu2 } from "@blueprintjs/popover2";
import { DarkTheme } from "./SharedComponents";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface CodepressNavigationContextMenuProps {
  type: "MODULE" | "CHALLENGE";
  handleDelete: () => void;
}

/** ===========================================================================
 * Context Menu
 * ============================================================================
 */

class CodepressNavigationContextMenu extends React.PureComponent<CodepressNavigationContextMenuProps> {
  render() {
    const label =
      this.props.type === "MODULE" ? "Delete Module" : "Delete Challenge";

    const ContextMenu = (
      <DarkTheme>
        <Menu>
          <MenuItem
            icon="cross"
            text={label}
            onClick={this.props.handleDelete}
          />
        </Menu>
      </DarkTheme>
    );

    return (
      <ContextMenu2 content={ContextMenu}>{this.props.children}</ContextMenu2>
    );
  }
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default CodepressNavigationContextMenu;
