import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer } from "./AdminComponents";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { COLORS } from "../tools/constants";
import { composeWithProps } from "../tools/admin-utils";
import { themeText } from "./AdminThemeContainer";
import AdminChartComponent from "./AdminChartComponent";
import {
  getUsersChartData,
  getUsersProgressChartData,
} from "../tools/admin-chart-utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {}

/** ===========================================================================
 * AdminGrowthPage Component
 * ============================================================================
 */

class AdminGrowthPage extends React.Component<IProps, IState> {
  componentDidMount() {
    // Create course select for this in the future
    this.props.fetchAllUsersProgress({ courseId: "fpvPtfu7s" });
  }

  render(): Nullable<JSX.Element> {
    return (
      <PageContainer>
        <Title>Pairwise User Growth</Title>
        {this.renderUsersGrowthChart()}
        <Title>User Course Progress Distribution</Title>
        {this.renderUsersProgressChart()}
      </PageContainer>
    );
  }

  renderUsersGrowthChart = () => {
    const { users } = this.props;
    if (users.length === 0) {
      return <p>No data yet...</p>;
    }

    const data = getUsersChartData(users);
    return (
      <AdminChartComponent
        data={data}
        xNameTooltipHide
        chartHeight={500}
        chartWidth={1000}
        xName="Created At Date"
        yName="Registered Users"
      />
    );
  };

  renderUsersProgressChart = () => {
    const { allUsersProgressState } = this.props;
    if (allUsersProgressState.length === 0) {
      return <p>No data yet...</p>;
    }

    const data = getUsersProgressChartData(allUsersProgressState);
    return (
      <AdminChartComponent
        data={data}
        chartHeight={500}
        chartWidth={1000}
        xName="Total Users"
        yName="Challenges Completed"
      />
    );
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const Title = styled.h2`
  ${themeText(COLORS.SECONDARY_YELLOW, COLORS.TEXT_LIGHT_THEME)};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  users: Modules.selectors.users.usersState(state).users,
  adminUserSettings: Modules.selectors.admin.adminUserSettings(state),
  allUsersProgressState: Modules.selectors.users.allUsersProgressState(state),
});

const dispatchProps = {
  fetchAllUsersProgress: Modules.actions.users.fetchAllUsersProgress,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface ComponentProps {}

type IProps = ConnectProps & RouteComponentProps & ComponentProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(
  withRouter(AdminGrowthPage),
);
