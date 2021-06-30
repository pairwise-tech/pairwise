import React from "react";
import { connect } from "react-redux";
import Modules, { ReduxStoreState } from "modules/root";
import {
  CodeText,
  PageContainer,
  JsonComponent,
  DataCard,
  KeyValue,
  SummaryText,
  CardButton,
  CardButtonRow,
  ExternalLink,
} from "./AdminComponents";
import { Collapse, Alert, Intent } from "@blueprintjs/core";
import { AdminUserView } from "../modules/users/store";
import { progressHistoryToChallengeCount } from "../tools/admin-utils";

/** ===========================================================================
 * AdminUsersPage Component
 * ============================================================================
 */

interface IState {
  uuid: Nullable<string>;
}

class AdminUsersPage extends React.Component<IProps, IState> {
  render(): Nullable<JSX.Element> {
    const { users } = this.props;
    const usersExist = users && users.length > 0;
    return (
      <PageContainer>
        <h2>Users List</h2>
        {usersExist ? (
          this.renderUsers(users)
        ) : (
          <SummaryText>
            There are currently {users.length} total registered users.
          </SummaryText>
        )}
      </PageContainer>
    );
  }

  renderUsers = (users: AdminUserView[]) => {
    const zeroChallengeUsers = [];
    const usersWithProgress = [];

    // Separate users with progress history and those with none
    for (const user of users) {
      if (Object.keys(user.challengeProgressHistory).length === 0) {
        zeroChallengeUsers.push(user);
      } else {
        usersWithProgress.push(user);
      }
    }

    // Ordered by progress history
    const orderedByChallengeCount = usersWithProgress.sort((a, b) => {
      const count = progressHistoryToChallengeCount;
      return (
        count(b.challengeProgressHistory) - count(a.challengeProgressHistory)
      );
    });

    return (
      <>
        <SummaryText style={{ maxWidth: 550 }}>
          There are currently {users.length} total registered users. A total of{" "}
          {zeroChallengeUsers.length} have completed zero challenges, and are
          excluded from the following list.
        </SummaryText>
        {orderedByChallengeCount.map(this.renderUsersList)}
      </>
    );
  };

  renderUsersList = (user: AdminUserView) => {
    return <AdminUserComponent key={user.uuid} user={user} />;
  };
}

/** ===========================================================================
 * Props & Export
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  users: Modules.selectors.users.usersState(state).users,
});

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

export default withProps(AdminUsersPage);

/** ===========================================================================
 * AdminUserBaseComponent
 * ============================================================================
 */

interface AdminUserComponentState {
  uuid: Nullable<string>;
  alert: null | "gift" | "refund";
}

class AdminUserBaseComponent extends React.Component<
  AdminUserBaseComponentProps,
  AdminUserComponentState
> {
  constructor(props: AdminUserBaseComponentProps) {
    super(props);

    this.state = {
      uuid: null,
      alert: null,
    };
  }

  render(): JSX.Element {
    const { alert } = this.state;
    const { user } = this.props;
    const showDetails = this.state.uuid === user.uuid;
    const payment = user.payments[0];
    const challengeTotal = progressHistoryToChallengeCount(
      user.challengeProgressHistory,
    );
    return (
      <DataCard key={user.uuid}>
        <Alert
          icon="dollar"
          canEscapeKeyCancel
          canOutsideClickCancel
          className="bp3-dark"
          isOpen={alert !== null}
          cancelButtonText="Cancel"
          intent={Intent.DANGER}
          onCancel={this.handleCancel}
          onConfirm={this.handleConfirm}
          confirmButtonText={alert === "gift" ? "Gift Course" : "Refund Course"}
        >
          {alert === "gift" ? (
            <p>
              Are you sure you want to gift the course to{" "}
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
        <KeyValue label="Email" value={user.email} allowCopy />
        <KeyValue label="uuid" value={user.uuid} code />
        <SummaryText>
          User has completed {challengeTotal}{" "}
          {challengeTotal === 1 ? "challenge" : "challenges"}.
        </SummaryText>
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
              style={{ color: "white" }}
              link={`mailto:${user.email}`}
            >
              Email User
            </ExternalLink>
          </CardButton>
          {!payment ? (
            <CardButton
              icon="dollar"
              onClick={() => this.setState({ alert: "gift" })}
            >
              Gift Course
            </CardButton>
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
            // re-stringify the progress history, otherwise this will
            // produce extremely tall content for users with a lot of
            // challenges. The presentation of the user progress
            // history could be changed later.
            data={JSON.stringify(user.challengeProgressHistory)}
          />
          <JsonComponent
            title="Settings:"
            data={JSON.parse(String(user.settings))}
          />
        </Collapse>
      </DataCard>
    );
  }

  handleCancel = () => {
    this.setState({ alert: null });
  };

  handleConfirm = () => {
    if (this.state.alert === "gift") {
      this.props.giftCourseForUser(this.props.user.email);
    } else {
      this.props.refundCourseForUser(this.props.user.email);
    }

    this.setState({ alert: null });
  };
}

/** ===========================================================================
 * Props & Export
 * ============================================================================
 */

const coursePaymentProps = {
  giftCourseForUser: Modules.actions.payments.giftCourseForUser,
  refundCourseForUser: Modules.actions.payments.refundCourseForUser,
};

type AdminUserBaseComponentProps = typeof coursePaymentProps & {
  user: AdminUserView;
};

export const AdminUserComponent = connect(
  null,
  coursePaymentProps,
)(AdminUserBaseComponent);
