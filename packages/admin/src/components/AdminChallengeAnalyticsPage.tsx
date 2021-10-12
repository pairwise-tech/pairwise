import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { KeyValue, PageContainer } from "./AdminComponents";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { Alert, Button, Icon, Intent } from "@blueprintjs/core";
import { COLORS, MOBILE } from "../tools/constants";
import { composeWithProps } from "../tools/admin-utils";
import { defaultTextColor, themeColor } from "./AdminThemeContainer";
import { None, Option, Some } from "@pairwise/common";
import toaster from "../tools/toast-utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

type SortCategory = "default" | "attempted" | "completed" | "ratio";

interface IState {
  alert: boolean;
  resetChallengeId: Option<string>;
  sortBy: SortCategory;
}

/** ===========================================================================
 * AdminChallengeAnalyticsPage Component
 * ============================================================================
 */

class AdminChallengeAnalyticsPage extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      alert: false,
      sortBy: "default",
      resetChallengeId: None(),
    };
  }

  render(): Nullable<JSX.Element> {
    const { alert, sortBy } = this.state;
    const { adminUserSettings, skeletons, challengeMetaMap } = this.props;

    const { appTheme } = adminUserSettings;
    const isDark = appTheme === "dark";

    if (!skeletons) {
      return null;
    }

    const MetaList = skeletons
      .map((skeleton) => {
        return skeleton.modules
          .map((module) => {
            return module.challenges.map((challenge) => {
              const meta = challengeMetaMap[challenge.id];

              let UI;
              let ratio = -1;

              const TitleBar = (
                <ChallengeTitleText>
                  [{module.title}]:{" "}
                  <ChallengeTitle>{challenge.title}</ChallengeTitle>
                </ChallengeTitleText>
              );

              if (meta) {
                ratio =
                  meta.numberOfTimesCompleted === 0
                    ? -1
                    : meta.numberOfTimesAttempted / meta.numberOfTimesCompleted;

                UI = (
                  <MetaCard key={challenge.id}>
                    {TitleBar}
                    <Text>Attempted: {meta.numberOfTimesAttempted}</Text>
                    <Text>Completed: {meta.numberOfTimesCompleted}</Text>
                    <Text>
                      Completion Ratio:{" "}
                      {ratio === -1 ? "n/a" : ratio.toFixed(2)}
                    </Text>
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
                      onClick={() =>
                        this.handleOpenResetChallengeMetaAlert(challenge.id)
                      }
                    />
                  </MetaCard>
                );
              } else {
                UI = (
                  <MetaCard key={challenge.id}>
                    {TitleBar}
                    <Text>
                      No challenge meta exists for challenge id {challenge.id}
                    </Text>
                  </MetaCard>
                );
              }

              return {
                UI,
                meta,
                ratio,
                challengeId: challenge.id,
              };
            });
          })
          .flat();
      })
      .flat();

    // Sort the list based on the selected sort category
    const sorted =
      sortBy === "default"
        ? MetaList
        : MetaList.filter((x) => !!x.meta).sort((a, b) => {
            if (sortBy === "attempted") {
              return (
                // @ts-ignore
                b.meta.numberOfTimesAttempted - a.meta.numberOfTimesAttempted
              );
            } else if (sortBy === "completed") {
              return (
                // @ts-ignore
                b.meta.numberOfTimesCompleted - a.meta.numberOfTimesCompleted
              );
            } else if (sortBy === "ratio") {
              // @ts-ignore
              return b.meta.ratio - a.meta.ratio;
            } else {
              throw new Error(
                "Invalid sort filter provided to challenge meta list",
              );
            }
          });

    const getSortIcon = (sortCategory: SortCategory) => {
      const active = sortBy === sortCategory;
      if (active) {
        const icon = "sort-desc";
        return <Icon icon={icon} color={COLORS.PRIMARY_BLUE} />;
      } else {
        return "search-template";
      }
    };

    return (
      <PageContainer>
        <Alert
          icon="dollar"
          isOpen={alert}
          canEscapeKeyCancel
          canOutsideClickCancel
          cancelButtonText="Cancel"
          intent={Intent.DANGER}
          onCancel={this.handleCancelResetChallengeMetaAlert}
          onConfirm={this.handleResetChallengeMeta}
          className={isDark ? "bp3-dark" : ""}
          confirmButtonText="Yes, Reset"
        >
          <p>
            This will reset both the challenge attempts and completed history to
            zero.
          </p>
          <p>Are you sure?</p>
        </Alert>
        <Title>Challenge Analytics</Title>
        <ControlRow>
          <Button
            icon={getSortIcon("default")}
            onClick={() => this.handleSortBy("default")}
            style={{ width: 175, marginRight: 8, marginBottom: 8 }}
          >
            Sort by Default
          </Button>
          <Button
            icon={getSortIcon("attempted")}
            onClick={() => this.handleSortBy("attempted")}
            style={{ width: 175, marginRight: 8, marginBottom: 8 }}
          >
            Sort by Attempted
          </Button>
          <Button
            icon={getSortIcon("completed")}
            onClick={() => this.handleSortBy("completed")}
            style={{ width: 175, marginRight: 8, marginBottom: 8 }}
          >
            Sort by Completed
          </Button>
          <Button
            icon={getSortIcon("ratio")}
            onClick={() => this.handleSortBy("ratio")}
            style={{ width: 175, marginRight: 8, marginBottom: 8 }}
          >
            Sort by Ratio
          </Button>
        </ControlRow>
        {sorted.map((x) => (
          <div key={x.challengeId}>{x.UI}</div>
        ))}
      </PageContainer>
    );
  }

  handleResetChallengeMeta = () => {
    const { resetChallengeId } = this.state;
    if (resetChallengeId.some) {
      this.props.resetChallengeMeta(resetChallengeId.value);
    } else {
      toaster.warn("No challenge id to reset...");
    }

    // In either case, close the alert.
    this.handleCancelResetChallengeMetaAlert();
  };

  handleOpenResetChallengeMetaAlert = (id: string) => {
    this.setState({
      alert: true,
      resetChallengeId: Some(id),
    });
  };

  handleCancelResetChallengeMetaAlert = () => {
    this.setState({
      alert: false,
      resetChallengeId: None(),
    });
  };

  handleSortBy = (sortBy: SortCategory) => {
    this.setState({ sortBy });
  };
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
  ${themeColor("color", COLORS.SECONDARY_YELLOW, COLORS.SECONDARY_PINK)};
`;

const Text = styled.p`
  font-size: 12px;
`;

const ControlRow = styled.div`
  display: flex;
  flex-direction: row;

  @media ${MOBILE} {
    flex-direction: column;
  }
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  skeletons: Modules.selectors.challenges.courseSkeletons(state),
  adminUserSettings: Modules.selectors.admin.adminUserSettings(state),
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
  withRouter(AdminChallengeAnalyticsPage),
);
