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
  ExternalLink,
} from "./AdminComponents";
import { Collapse, Button, Alert, Intent } from "@blueprintjs/core";
import { AdminUserView } from "../modules/users/store";

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
    return (
      <PageContainer>
        <h2>Users List</h2>
        <SummaryText>
          There are currently {users.length} total registered users.
        </SummaryText>
        {users && users.map(this.renderUsersList)}
      </PageContainer>
    );
  }

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
        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <Button
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
          </Button>
          <Button style={{ marginLeft: 12, marginRight: 12 }} icon="inbox">
            <ExternalLink
              style={{ color: "white" }}
              link={`mailto:${user.email}`}
            >
              Email User
            </ExternalLink>
          </Button>
          {!payment ? (
            <Button
              icon="dollar"
              onClick={() => this.setState({ alert: "gift" })}
            >
              Gift Course
            </Button>
          ) : payment.status === "CONFIRMED" ? (
            <Button
              icon="dollar"
              onClick={() => this.setState({ alert: "refund" })}
            >
              Refund Course
            </Button>
          ) : (
            <Button disabled>Payment has been refunded.</Button>
          )}
        </div>
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
