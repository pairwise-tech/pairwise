import { Classes } from "@blueprintjs/core";
import cx from "classnames";
import styled from "styled-components/macro";
import { connect } from "react-redux";
import { ThemeProvider } from "styled-components";
import Modules, { ReduxStoreState } from "../modules/root";
import { COLORS } from "../tools/constants";
import React from "react";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

export interface ITheme {
  dark: boolean;
}

export interface IThemeProps {
  theme: ITheme;
}

export const themeColor = (
  propName: "color" | "background",
  dark: string,
  light?: string,
) => {
  return (props: IThemeProps) => {
    const style = props.theme.dark ? dark : light;
    const css = `${propName}: ${style}`;
    return css;
  };
};

export const themeText = (dark: string, light?: string) => {
  return themeColor("color", dark, light);
};

export const defaultTextColor = themeText(COLORS.TEXT_WHITE);

/** ===========================================================================
 * Component
 * ============================================================================
 */

class ThemeContainer extends React.Component<IProps, {}> {
  componentDidMount() {
    this.setBackground();
  }

  componentDidUpdate(prevProps: IProps) {
    if (prevProps.userSettings.appTheme !== this.props.userSettings.appTheme) {
      this.setBackground();
    }
  }

  setBackground = () => {
    if (this.props.userSettings.appTheme === "dark") {
      document.body.style.background = COLORS.BACKGROUND_PAGE_DARK;
    } else {
      document.body.style.background = COLORS.BACKGROUND_PAGE_LIGHT;
    }
  };

  render() {
    const { className, userSettings, ...rest } = this.props;

    let isDarkTheme = false;
    let themeClass;
    if (userSettings.appTheme === "dark") {
      isDarkTheme = true;
      themeClass = Classes.DARK;
    }

    const theme: ITheme = {
      dark: isDarkTheme,
    };

    return (
      <ThemeProvider theme={theme}>
        <Background>
          <div className={cx(className, themeClass)} {...rest} />
        </Background>
      </ThemeProvider>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const Background = styled.div`
  ${themeColor(
    "background",
    COLORS.BACKGROUND_PAGE_DARK,
    COLORS.BACKGROUND_PAGE_LIGHT,
  )};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  userSettings: Modules.selectors.user.userSettings(state),
});

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface ComponentProps {
  className?: string;
  children: React.ReactNode;
}

type IProps = ConnectProps & ComponentProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(ThemeContainer);
