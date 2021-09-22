import { isMobile } from "react-device-detect";
import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { Row, KeyValue, SummaryText, PageContainer } from "./AdminComponents";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { Button, Card, Switch } from "@blueprintjs/core";
import { COLORS } from "../tools/constants";
import { composeWithProps } from "../tools/admin-utils";
import { defaultTextColor, themeColor, themeText } from "./AdminThemeContainer";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {}

/** ===========================================================================
 * AdminPullRequestPage Component
 * ============================================================================
 */

class AdminChallengeAnalytics extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {};
  }

  render(): Nullable<JSX.Element> {
    const { skeletons, challengeMetaMap, resetChallengeMeta } = this.props;

    if (!skeletons) {
      return null;
    }

    return (
      <PageContainer>
        <Title>Challenge Analytics</Title>
        {skeletons.map((skeleton) => {
          return skeleton.modules.map((module) => {
            return module.challenges.map((challenge) => {
              const meta = challengeMetaMap[challenge.id];

              const TitleBar = (
                <ChallengeTitleText>
                  [{module.title}]:{" "}
                  <ChallengeTitle>{challenge.title}</ChallengeTitle>
                </ChallengeTitleText>
              );

              if (meta) {
                let ratio =
                  meta.numberOfTimesCompleted === 0
                    ? "n/a"
                    : (
                        meta.numberOfTimesAttempted /
                        meta.numberOfTimesCompleted
                      ).toFixed(2);

                return (
                  <MetaCard key={challenge.id}>
                    {TitleBar}
                    <Text>Attempted: {meta.numberOfTimesAttempted}</Text>
                    <Text>Completed: {meta.numberOfTimesCompleted}</Text>
                    <Text>Completion Ratio: {ratio}</Text>
                    <Text>
                      Challenge ID:{" "}
                      <KeyValue
                        code
                        label=""
                        isChallengeId
                        renderChallengeIdOnly
                        value={challenge.id}
                      />
                    </Text>
                    <Button
                      style={{ marginTop: 6, marginBottom: 6, fontSize: 12 }}
                      icon="reset"
                      text="Reset Challenge Meta"
                      onClick={() => resetChallengeMeta(challenge.id)}
                    />
                  </MetaCard>
                );
              } else {
                return (
                  <MetaCard key={challenge.id}>
                    {TitleBar}
                    <Text>
                      No challenge meta exists for challenge id {challenge.id}
                    </Text>
                  </MetaCard>
                );
              }
            });
          });
        })}
      </PageContainer>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const MetaCard = styled.div`
  margin-top: 4px;
  padding: 12px;
  max-width: 450px;
  background: rgba(5, 5, 5, 0.25);
`;

const Title = styled.h2`
  ${defaultTextColor};
`;

const ChallengeTitleText = styled.p`
  font-size: 14px;
  color: ${COLORS.GRAY_TEXT};
`;

const ChallengeTitle = styled.span`
  color: ${COLORS.SECONDARY_YELLOW};
`;

const Text = styled.p`
  font-size: 12px;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  skeletons: Modules.selectors.challenges.courseSkeletons(state),
  challengeMetaMap: Modules.selectors.challenges.challengeMetaMap(state),
});

const dispatchProps = {
  resetChallengeMeta: Modules.actions.challenges.resetChallengeMeta,
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
  withRouter(AdminChallengeAnalytics),
);
