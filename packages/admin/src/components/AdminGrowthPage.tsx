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
  getGlobalProgressHistory,
  getUsersChartData,
  getUsersProgressChartData,
} from "../tools/admin-chart-utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  // TODO: Make this configurable with a course select in the future
  courseId: string;
}

/** ===========================================================================
 * AdminGrowthPage Component
 * ============================================================================
 */

class AdminGrowthPage extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      courseId: "fpvPtfu7s",
    };
  }

  componentDidMount() {
    // Create course select for this in the future
    this.props.fetchAllUsersProgress({ courseId: this.state.courseId });
  }

  render(): Nullable<JSX.Element> {
    return (
      <PageContainer>
        <Title>Pairwise User Growth</Title>
        {this.renderUsersGrowthChart()}
        <Title>Pairwise Challenge Growth</Title>
        {this.renderGlobalChallengeProgressChart()}
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

    const data = getUsersChartData(users, this.state.courseId);
    return (
      <AdminChartComponent
        data={data}
        xNameTooltipHide
        chartHeight={500}
        chartWidth={1000}
        xName="Created At Date"
        yName="User Growth"
        additionalAreaElements={[
          {
            name: "Non Zero Users",
            dataKey: "nonZeroRunningTotal",
            id: "secondarySeries",
            color: "#49F480",
          },
          {
            name: "More Than 5 Challenges",
            dataKey: "moreThanFiveUsersTotal",
            id: "tertiarySeries",
            color: "#F3577A",
          },
          {
            name: "More Than 25 Challenges",
            dataKey: "moreThanTwentyFiveUsersTotal",
            id: "quaternarySeries",
            color: "#F6FA88",
          },
        ]}
      />
    );
  };

  renderGlobalChallengeProgressChart = () => {
    const { globalChallengeProgressSeries } = this.props;
    console.log(globalChallengeProgressSeries);
    const data = getGlobalProgressHistory(globalChallengeProgressSeries);
    console.log(data);
    return (
      <AdminChartComponent
        data={data}
        chartHeight={500}
        chartWidth={1000}
        yName="Total Challenges"
        xName="Date"
      />
    );
  };

  renderUsersProgressChart = () => {
    const { userProgressDistribution } = this.props;
    if (userProgressDistribution.length === 0) {
      return <p>No data yet...</p>;
    }

    const data = getUsersProgressChartData(userProgressDistribution);
    return (
      <AdminChartComponent
        data={data}
        chartHeight={500}
        chartWidth={1000}
        yName="Total Users"
        xName="Challenges Completed"
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
  userProgressDistribution:
    Modules.selectors.users.userProgressDistribution(state),
  globalChallengeProgressSeries:
    Modules.selectors.users.globalChallengeProgressSeries(state),
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
