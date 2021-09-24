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
import { getUsersChartData } from "../tools/admin-chart-utils";

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
  render(): Nullable<JSX.Element> {
    const { skeletons, users } = this.props;

    if (!skeletons) {
      return null;
    }

    const data = getUsersChartData(users);

    return (
      <PageContainer>
        <Title>Pairwise User Growth</Title>
        <AdminChartComponent
          xNameTooltipHide
          chartHeight={500}
          chartWidth={1000}
          data={data}
          xName="Created At Date"
          yName="Registered Users"
        />
      </PageContainer>
    );
  }
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
  skeletons: Modules.selectors.challenges.courseSkeletons(state),
  challengeMetaMap: Modules.selectors.challenges.challengeMetaMap(state),
  users: Modules.selectors.users.usersState(state).users,
  adminUserSettings: Modules.selectors.admin.adminUserSettings(state),
});

const dispatchProps = {};

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
