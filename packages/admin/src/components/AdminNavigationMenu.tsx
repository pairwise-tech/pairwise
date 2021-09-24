import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { COLORS, HEADER_HEIGHT, MOBILE } from "tools/constants";
import { capitalize, composeWithProps } from "tools/admin-utils";
import { Button } from "@blueprintjs/core";
import { NavLink, RouteComponentProps } from "react-router-dom";
import cx from "classnames";
import { defaultTextColor, themeColor } from "./AdminThemeContainer";

export const ADMIN_MENU_ITEMS_ROUTES = [
  "stats",
  "growth",
  "users",
  "payments",
  "feedback",
  "search",
  "pull-requests",
  "challenge-analytics",
];

// Represents the max index for the routes listed in the admin nav menu
export const ADMIN_MENU_MAX_INDEX = ADMIN_MENU_ITEMS_ROUTES.length - 1;

/** ===========================================================================
 * React Class
 * ============================================================================
 */

class AdminNavigationMenu extends React.Component<
  IProps,
  { showModuleList: boolean }
> {
  state = {
    showModuleList: false,
  };

  toggleModuleListOpen = () => {
    this.setState({
      showModuleList: !this.state.showModuleList,
    });
  };

  componentDidMount() {
    this.lockWindowScrolling();
  }

  // Don't re-render when the nav is not open
  shouldComponentUpdate(nextProps: IProps) {
    return this.props.overlayVisible || nextProps.overlayVisible;
  }

  componentDidUpdate() {
    this.lockWindowScrolling();
  }

  lockWindowScrolling = () => {
    if (this.props.overlayVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "visible";
    }
  };

  render(): Nullable<JSX.Element> {
    const { overlayVisible } = this.props;

    return (
      <Overlay visible={overlayVisible} onClick={this.handleClose}>
        <Col
          style={{ zIndex: 3 }}
          offsetX={overlayVisible ? 0 : -20}
          onClick={(e) => e.stopPropagation()}
          className={cx("module-select", { open: this.state.showModuleList })}
        >
          <ColTitle>
            <Button
              fill
              icon="shield"
              text="Toggle App Theme"
              className="mobile-shrink"
              onClick={this.toggleAppTheme}
              style={{ whiteSpace: "nowrap" }}
            />
          </ColTitle>
          <ColScroll>{this.renderAdminMenuLinks()}</ColScroll>
        </Col>
      </Overlay>
    );
  }

  renderAdminMenuLinks = () => {
    const { menuSelectItemIndex } = this.props;
    return (
      <div style={{ marginTop: 1, marginBottom: 1 }}>
        {ADMIN_MENU_ITEMS_ROUTES.map((path, index) => {
          return (
            <NavLink to={`/${path}`} key={path}>
              <ModuleNavigationButton selected={menuSelectItemIndex === index}>
                <span>{path.split("-").map(capitalize).join(" ")}</span>
              </ModuleNavigationButton>
            </NavLink>
          );
        })}
      </div>
    );
  };

  handleClose = () => {
    if (this.props.overlayVisible) {
      this.props.setNavigationMapState(false);
    }
  };

  toggleAppTheme = () => {
    this.props.updateUserSettings({
      appTheme:
        this.props.adminUserSettings.appTheme === "dark" ? "light" : "dark",
    });
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const ModuleNavigationBase = styled.div<{ active?: boolean }>`
  cursor: pointer;
  padding-left: 12px;
  padding-top: 12px;
  padding-bottom: 12px;
  padding-right: 2px;
  font-size: 18px;
  border: 1px solid transparent;
  border-bottom-color: ${(props) => {
    return props.theme.dark ? COLORS.LIGHT_GREY : COLORS.LIGHT_BORDER;
  }};

  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  position: relative;

  span {
    display: flex;
    align-items: center;
  }

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
`;

const ModuleNavigationButtonBase = styled(ModuleNavigationBase)<{
  active?: boolean;
  selected?: boolean;
}>`
  outline: none;

  color: ${(props) => {
    if (props.active) {
      return props.theme.dark ? "white" : "black";
    } else {
      return props.theme.dark ? COLORS.TEXT_TITLE : COLORS.TEXT_LIGHT_THEME;
    }
  }};

  background: ${({ active }) =>
    active ? COLORS.BACKGROUND_MODAL : "transparent"};

  ${(props) =>
    props.selected &&
    `
      outline-width: 1px;
      outline-style: solid;
      outline-color: ${COLORS.FAILURE};
      ${themeColor(
        "background",
        COLORS.BACKGROUND_DROPDOWN_MENU_HOVER,
        COLORS.WHITE,
      )};
    `}

  &:hover {
    ${defaultTextColor};
    ${themeColor(
      "background",
      COLORS.BACKGROUND_DROPDOWN_MENU_HOVER,
      COLORS.BACKGROUND_DROPDOWN_MENU_HOVER_LIGHT,
    )};

    &:after {
      transform: scale(1);
    }
  }
`;

const ModuleNavigationButton = ({
  active,
  ...rest
}: { active?: boolean } & any) => (
  <ModuleNavigationButtonBase active={active} as="button" {...rest} />
);

const Col = styled.div<{ offsetX: number }>`
  display: flex;
  flex-direction: column;
  width: 300px;
  border-right: 1px solid ${COLORS.LIGHT_GREY};
  position: relative;
  z-index: 2;
  transition: all 0.2s ease-out;
  transform: translateX(${({ offsetX }) => `${offsetX}px`});

  ${themeColor(
    "background",
    COLORS.BACKGROUND_CONTENT_DARK,
    COLORS.BACKGROUND_CONTENT_LIGHT,
  )};

  &.challenge-select {
    width: 600px;
  }

  @media ${MOBILE} {
    ${ModuleNavigationBase} {
      white-space: nowrap;
    }

    &.challenge-select {
      width: 90vw;
    }
  }
`;

const ColScroll = styled.div`
  overflow: auto;
`;

const Overlay = styled.div<{ visible: boolean }>`
  top: ${HEADER_HEIGHT}px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 15;
  position: fixed;
  background: rgba(0, 0, 0, 0.85);
  visibility: ${(props) => (props.visible ? "visible" : "hidden")};
  opacity: ${(props) => (props.visible ? "1" : "0")};
  pointer-events: ${(props) => (props.visible ? "all" : "none")};
  display: flex;
  transition: all 0.2s ease-out;
`;

const ColTitle = styled.div`
  font-size: 18px;
  font-weight: 200;
  ${defaultTextColor};
  margin: 0;
  height: 40px;
  padding: 0 12px;
  font-variant: small-caps;
  font-weight: bold;
  letter-spacing: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-grow: 0;
  flex-shrink: 0;
  ${themeColor("background", COLORS.BACKGROUND_NAVIGATION_ITEM, COLORS.WHITE)};

  p {
    margin: 0;
  }

  &.course-select {
    padding: 0 6px;

    .bp3-popover-wrapper,
    .bp3-popover-target {
      width: 100%;
    }
  }

  @media ${MOBILE} {
    &.course-select {
      display: flex;
      justify-content: center;
    }
  }
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  adminUserSettings: Modules.selectors.admin.adminUserSettings(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
  menuSelectItemIndex: Modules.selectors.challenges.menuSelectItemIndex(state),
});

const ChallengeActions = Modules.actions.challenges;

const dispatchProps = {
  setNavigationMapState: ChallengeActions.setNavigationMapState,
  updateUserSettings: Modules.actions.admin.updateUserSettings,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps & ComponentProps & RouteComponentProps;

interface ComponentProps {
  isMobile: boolean;
}

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(AdminNavigationMenu);
