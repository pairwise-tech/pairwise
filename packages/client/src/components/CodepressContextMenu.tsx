import React from "react";
import { ContextMenu, Menu, MenuItem } from "@blueprintjs/core";
import { DarkTheme } from "./Shared";

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

export default class CodepressNavigationContextMenu extends React.PureComponent<CodepressNavigationContextMenuProps> {
  componentWillUnmount() {
    ContextMenu.hide(); /* Remove this code and you will suffer */
  }

  render() {
    return (
      <div onContextMenu={this.showContextMenu}>{this.props.children}</div>
    );
  }

  showContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    const { type } = this.props;
    const label = type === "MODULE" ? "Delete Module" : "Delete Challenge";
    const coordinates = { left: e.clientX, top: e.clientY };

    const Context = (
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

    ContextMenu.show(Context, coordinates);
  };
}
