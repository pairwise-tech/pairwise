import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { assertUnreachable, ICodeBlobDto } from "@pairwise/common";
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
  Input,
  Row,
  Key,
  LabelRow,
} from "./AdminComponents";
import { Button, Collapse, Alert, Intent, Icon } from "@blueprintjs/core";
import { AdminUserView } from "../modules/users/store";
import { progressHistoryToChallengeCount } from "../tools/admin-utils";
import { COLORS, MOBILE } from "../tools/constants";
import { BlobCache } from "../modules/challenges/store";

/** ===========================================================================
 * AdminUsersPage Component
 * ============================================================================
 */

type FILTER = "payments" | "challenges" | "updated";
type FILTER_DIRECTION = "ASC" | "DESC";

interface IState {
  filter: FILTER;
  uuid: Nullable<string>;
  filterDirection: FILTER_DIRECTION;
}

class AdminUsersPage extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      uuid: null,
      filter: "challenges",
      filterDirection: "DESC",
    };
  }

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
    const { filter, filterDirection } = this.state;
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

    // Order by the current filters
    const sortedUsersList = usersWithProgress.sort((a, b) => {
      let getValue: (user: AdminUserView) => number;

      switch (filter) {
        case "payments":
          getValue = (user: AdminUserView) => user.payments.length;
          break;
        case "challenges":
          getValue = (user: AdminUserView) => {
            return progressHistoryToChallengeCount(
              user.challengeProgressHistory,
            );
          };
          break;
        case "updated":
          getValue = (user: AdminUserView) => {
            return new Date(user.updatedAt).getTime();
          };
          break;
        default:
          assertUnreachable(filter);
      }

      if (filterDirection === "DESC") {
        return getValue(b) - getValue(a);
      } else {
        return getValue(a) - getValue(b);
      }
    });

    const getSortIcon = (buttonFilter: FILTER) => {
      const active = buttonFilter === filter;
      if (active) {
        const icon = filterDirection === "ASC" ? "sort-asc" : "sort-desc";
        return <Icon icon={icon} color={COLORS.PRIMARY_BLUE} />;
      } else {
        return "search-template";
      }
    };

    return (
      <>
        <SummaryText style={{ maxWidth: 550 }}>
          There are currently {users.length} total registered users. A total of{" "}
          {zeroChallengeUsers.length} have completed zero challenges, and are
          excluded from the following list.
        </SummaryText>
        <ControlRow>
          <Button
            icon={getSortIcon("challenges")}
            style={{ width: 175, marginRight: 8, marginBottom: 8 }}
            onClick={() => this.handleApplyFilters("challenges")}
          >
            Sort by Challenges
          </Button>
          <Button
            icon={getSortIcon("updated")}
            style={{ width: 175, marginRight: 8, marginBottom: 8 }}
            onClick={() => this.handleApplyFilters("updated")}
          >
            Sort by Last Active
          </Button>
          <Button
            icon={getSortIcon("payments")}
            style={{ width: 175, marginRight: 8, marginBottom: 8 }}
            onClick={() => this.handleApplyFilters("payments")}
          >
            Sort by Payments
          </Button>
        </ControlRow>
        {sortedUsersList.map(this.renderUsersList)}
      </>
    );
  };

  renderUsersList = (user: AdminUserView) => {
    return (
      <AdminUserComponent
        key={user.uuid}
        user={user}
        challengeBlobCache={this.props.challengeBlobCache}
      />
    );
  };

  handleApplyFilters = (newFilter: FILTER) => {
    const { filter, filterDirection } = this.state;

    let newDirection: FILTER_DIRECTION;
    if (newFilter === filter) {
      newDirection = filterDirection === "ASC" ? "DESC" : "ASC";
    } else {
      newDirection = "DESC";
    }

    this.setState({
      filter: newFilter,
      filterDirection: newDirection,
    });
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const ControlRow = styled.div`
  display: flex;
  flex-direction: row;

  @media ${MOBILE} {
    flex-direction: column;
  }
`;

/** ===========================================================================
 * Props & Export
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  users: Modules.selectors.users.usersState(state).users,
  challengeBlobCache: Modules.selectors.challenges.challengeBlobCache(state),
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
  challengeId: string;
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
      challengeId: "",
    };
  }

  render(): JSX.Element {
    const { alert } = this.state;
    const { user, challengeBlobCache } = this.props;
    const showDetails = this.state.uuid === user.uuid;
    const payment = user.payments[0];
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
            data={user.challengeProgressHistory}
          />
          <JsonComponent
            title="Settings:"
            data={JSON.parse(String(user.settings))}
          />
          <div style={{ height: 12 }} />
          <Key>Lookup Challenge Blob:</Key>
          <Row>
            <Input
              id="admin-input"
              placeholder="Find challenge blob"
              style={{ width: 250, marginRight: 8 }}
              value={this.state.challengeId}
              onChange={(e) => this.setState({ challengeId: e.target.value })}
            />
            <Button text="Find Blob" onClick={this.handleSearchBlob} />
          </Row>
          {!!blob && <JsonComponent title="Challenge Blob:" data={blob} />}
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

  handleSearchBlob = () => {
    const { uuid, challengeId } = this.state;
    if (uuid && challengeId) {
      this.props.fetchChallengeBlob({ uuid, challengeId });
    }
  };
}

/** ===========================================================================
 * Props & Export
 * ============================================================================
 */

const coursePaymentProps = {
  giftCourseForUser: Modules.actions.payments.giftCourseForUser,
  refundCourseForUser: Modules.actions.payments.refundCourseForUser,
  fetchChallengeBlob: Modules.actions.challenges.fetchChallengeBlob,
};

type AdminUserBaseComponentProps = typeof coursePaymentProps & {
  user: AdminUserView;
  challengeBlobCache: BlobCache;
};

export const AdminUserComponent = connect(
  null,
  coursePaymentProps,
)(AdminUserBaseComponent);
