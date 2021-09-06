import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { AppTheme, PAYMENT_PLAN } from "@pairwise/common";
import Modules, { ReduxStoreState } from "modules/root";
import {
  CodeText,
  JsonComponent,
  DataCard,
  KeyValue,
  SummaryText,
  CardButton,
  CardButtonRow,
  ExternalLink,
  Input,
  Row,
  Key,
} from "./AdminComponents";
import { Button, Collapse, Alert, Intent } from "@blueprintjs/core";
import { AdminUserView } from "../modules/users/store";
import {
  computeCourseProgressSummary,
  progressHistoryToChallengeCount,
} from "../tools/admin-utils";
import { COLORS, MOBILE } from "../tools/constants";
import { BlobCache } from "../modules/challenges/store";
import { themeColor } from "./AdminThemeContainer";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface AdminUserComponentState {
  challengeId: string;
  plan: Nullable<PAYMENT_PLAN>;
  uuid: Nullable<string>;
  alert: null | "gift" | "refund";
}

/** ===========================================================================
 * AdminUserComponent
 * ============================================================================
 */

class AdminUserComponent extends React.Component<
  IProps,
  AdminUserComponentState
> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      uuid: null,
      alert: null,
      plan: null,
      challengeId: "",
    };
  }

  render(): JSX.Element {
    const { alert } = this.state;
    const {
      user,
      courseSkeletons,
      adminUserSettings,
      challengeBlobCache,
      markCoachingSessionComplete,
    } = this.props;
    const isDark = adminUserSettings.appTheme === "dark";
    const showDetails = this.state.uuid === user.uuid;
    const payment = user.payments[0];
    const IS_PREMIUM = payment.plan === "PREMIUM";
    const challengeTotal = progressHistoryToChallengeCount(
      user.challengeProgressHistory,
    );

    const key = `${user.uuid}-${this.state.challengeId}`;
    const blob = challengeBlobCache[key];

    return (
      <DataCard key={user.uuid}>
        <Alert
          icon="dollar"
          canEscapeKeyCancel
          canOutsideClickCancel
          isOpen={alert !== null}
          cancelButtonText="Cancel"
          intent={Intent.DANGER}
          onCancel={this.handleCancel}
          onConfirm={this.handleConfirm}
          className={isDark ? "bp3-dark" : ""}
          confirmButtonText={alert === "gift" ? "Gift Course" : "Refund Course"}
        >
          {alert === "gift" ? (
            <p>
              Are you sure you want to gift the {this.state.plan} course to{" "}
              <CodeText>{user.email}</CodeText>?
            </p>
          ) : (
            <p>
              Are you sure you want to refund the course payment for{" "}
              <CodeText>{user.email}</CodeText>?<br />
              <br />
              You will also need to refund the payment transaction in Stripe.
            </p>
          )}
        </Alert>
        {IS_PREMIUM && (
          <PremiumBadge>
            <span style={{ fontWeight: 500, color: COLORS.PRIMARY_GREEN }}>
              PREMIUM USER
            </span>
          </PremiumBadge>
        )}
        <KeyValue label="Email" value={user.email} allowCopy />
        <KeyValue label="uuid" value={user.uuid} code />
        <SummaryText>
          User has completed {challengeTotal}{" "}
          {challengeTotal === 1 ? "challenge" : "challenges"}.
        </SummaryText>
        {user.coachingSessions > 0 ? (
          <SummaryText>
            User currently has {user.coachingSessions} coaching session
            {user.coachingSessions > 1 ? "s " : " "}
            available.
          </SummaryText>
        ) : (
          <SummaryText>User has no coaching sessions.</SummaryText>
        )}
        <CardButtonRow style={{ marginBottom: 24 }}>
          <CardButton
            icon="info-sign"
            onClick={() => {
              if (showDetails) {
                this.setState({ uuid: null });
              } else {
                this.setState({ uuid: user.uuid });
              }
            }}
          >
            {showDetails ? "Hide" : "View"} User Details
          </CardButton>
          <CardButton icon="inbox">
            <ExternalLink
              link={`mailto:${user.email}`}
              style={{ color: this.props.theme === "dark" ? "white" : "black" }}
            >
              Email User
            </ExternalLink>
          </CardButton>
          {!payment ? (
            <>
              <CardButton
                icon="dollar"
                onClick={() =>
                  this.setState({ alert: "gift", plan: "REGULAR" })
                }
              >
                Gift Course (REGULAR)
              </CardButton>
              <CardButton
                icon="dollar"
                onClick={() =>
                  this.setState({ alert: "gift", plan: "PREMIUM" })
                }
              >
                Gift Course (PREMIUM)
              </CardButton>
            </>
          ) : payment.status === "CONFIRMED" ? (
            <CardButton
              icon="dollar"
              onClick={() => this.setState({ alert: "refund" })}
            >
              Refund Course
            </CardButton>
          ) : (
            <CardButton disabled>Payment has been refunded.</CardButton>
          )}
          {user.coachingSessions > 0 && (
            <CardButton
              icon="hat"
              onClick={() =>
                markCoachingSessionComplete({ userUuid: user.uuid })
              }
            >
              Complete a Coaching Session
            </CardButton>
          )}
        </CardButtonRow>
        <Collapse isOpen={showDetails}>
          <KeyValue label="Given Name" value={user.givenName} />
          <KeyValue label="Family Name" value={user.familyName} />
          <KeyValue label="Display Name" value={user.displayName} />
          <KeyValue
            label="facebookAccountId"
            value={user.facebookAccountId}
            code
          />
          <KeyValue label="githubAccountId" value={user.githubAccountId} code />
          <KeyValue label="googleAccountId" value={user.googleAccountId} code />
          <KeyValue
            label="createdAt"
            value={new Date(user.createdAt).toLocaleString()}
          />
          <KeyValue
            label="updatedAt"
            value={new Date(user.updatedAt).toLocaleString()}
          />
          <div style={{ height: 12 }} />
          <JsonComponent title="Payments:" data={user.payments} />
          <JsonComponent
            title="Challenge Progress:"
            data={user.challengeProgressHistory}
          />
          {user.challengeProgressHistory.map((history) => {
            const { courseId, progress } = history;

            const courseSkeleton = courseSkeletons?.find(
              (x) => x.id === courseId,
            );
            if (!courseSkeleton) {
              return null;
            }

            const stats = computeCourseProgressSummary(
              progress,
              courseSkeleton,
            );

            if (!stats) {
              return null;
            }

            return (
              <div
                key={courseSkeleton.id}
                style={{ marginTop: 12, marginBottom: 12 }}
              >
                <p>
                  {courseSkeleton.title} Course Progress Overview (
                  {stats.percentComplete.toFixed(2)}% Complete):
                </p>
                <ProgressBar>
                  <ProgressComplete progress={stats.percentComplete} />
                </ProgressBar>
                {Array.from(stats.summary.entries()).map(([id, stats]) => {
                  const { title, completed, total } = stats;
                  const percent = total === 0 ? 0 : (completed / total) * 100;
                  return (
                    <ModuleProgressBar key={id}>
                      <ModuleProgressPercentage>
                        {percent.toFixed(0)}%
                      </ModuleProgressPercentage>
                      <ModuleProgressTitle>{title}</ModuleProgressTitle>
                    </ModuleProgressBar>
                  );
                })}
              </div>
            );
          })}
          <div style={{ height: 12 }} />
          <Key>Lookup Challenge Blob:</Key>
          <Row style={{ marginTop: 8 }}>
            <Input
              id="admin-input"
              placeholder="Find blob by challenge id"
              value={this.state.challengeId}
              style={{ width: 250, marginRight: 8 }}
              onChange={(e) => this.setState({ challengeId: e.target.value })}
            />
            <Button text="Find Blob" onClick={this.handleSearchBlob} />
          </Row>
          {!!blob && (
            <div style={{ marginBottom: 12 }}>
              <JsonComponent title="Challenge Blob Result:" data={blob} />
              {blob.dataBlob &&
                "code" in blob.dataBlob &&
                this.renderCodeDeepLink(
                  this.state.challengeId,
                  blob.dataBlob.code,
                )}
            </div>
          )}
          <JsonComponent
            title="Settings:"
            data={JSON.parse(String(user.settings))}
          />
        </Collapse>
      </DataCard>
    );
  }

  renderCodeDeepLink = (challengeId: string, codeString: string) => {
    const code = encodeURIComponent(codeString);
    const link = `https://app.pairwise.tech/workspace/${challengeId}?code=${code}`;
    return (
      <ExternalLink link={link}>
        Open Challenge Blob Code String in Pairwise
      </ExternalLink>
    );
  };

  handleCancel = () => {
    this.setState({ alert: null });
  };

  handleConfirm = () => {
    if (this.state.alert === "gift") {
      // Course id is hard-coded for now.
      const courseId = "fpvPtfu7s";
      const userEmail = this.props.user.email;
      const plan: PAYMENT_PLAN = this.state.plan || "REGULAR";
      const payload = { plan, userEmail, courseId };
      this.props.giftCourseForUser(payload);
    } else {
      this.props.refundCourseForUser(this.props.user.email);
    }

    this.setState({ alert: null });
  };

  handleSearchBlob = () => {
    const { uuid, challengeId } = this.state;
    if (uuid && challengeId) {
      this.props.fetchChallengeBlob({ uuid, challengeId });
    }
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const ProgressBar = styled.div`
  height: 30px;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 10px;
  ${themeColor("background", COLORS.PROGRESS_BACKGROUND, COLORS.GRAY)}
`;

const ProgressComplete = styled.div<{ progress: number }>`
  height: 30px;
  width: ${(props) => props.progress}%;
  background: ${COLORS.PROGRESS_COMPLETE};
`;

const ModuleProgressBar = styled.div`
  margin-top: 2px;
  display: flex;
  flex-direction: row;
`;

const ModuleProgressTitle = styled.div`
  width: 265px;
  padding-top: 3px;
  padding-left: 5px;
  padding-bottom: 3px;
  ${themeColor("background", COLORS.TEXT_DARK, COLORS.GRAY)}
`;

const ModuleProgressPercentage = styled.div`
  width: 50px;
  padding-top: 3px;
  padding-left: 3px;
  padding-bottom: 3px;
  ${themeColor("background", COLORS.PROGRESS_BACKGROUND, COLORS.WHITE)}
`;

const PremiumBadge = styled.div`
  margin-top: -6px;
  margin-right: -4px;
  padding: 4px 8px;
  float: right;
  border-radius: 4px;
  text-align: center;
  ${themeColor("background", "rgb(35,35,35)", "rgb(75,75,75)")}
`;

/** ===========================================================================
 * Props & Export
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  adminUserSettings: Modules.selectors.admin.adminUserSettings(state),
  courseSkeletons: Modules.selectors.challenges.courseSkeletons(state),
});

const dispatchProps = {
  giftCourseForUser: Modules.actions.payments.giftCourseForUser,
  refundCourseForUser: Modules.actions.payments.refundCourseForUser,
  fetchChallengeBlob: Modules.actions.challenges.fetchChallengeBlob,
  markCoachingSessionComplete:
    Modules.actions.users.markCoachingSessionComplete,
};

type IProps = ReturnType<typeof mapStateToProps> &
  typeof dispatchProps & {
    theme: AppTheme;
    user: AdminUserView;
    challengeBlobCache: BlobCache;
  };

export default connect(mapStateToProps, dispatchProps)(AdminUserComponent);
