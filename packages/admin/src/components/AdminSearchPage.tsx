import { isMobile } from "react-device-detect";
import React from "react";
import { connect } from "react-redux";
import Modules, { ReduxStoreState } from "modules/root";
import { CodeText, PageContainer, SummaryText } from "./AdminComponents";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { parseSearchQuery, composeWithProps } from "../tools/admin-utils";
import AdminUserComponent from "./AdminUserComponent";
import { assertUnreachable } from "@pairwise/common";
import { COLORS } from "../tools/constants";
import { Code } from "@blueprintjs/core";
import { ChallengeContextCard } from "./AdminChallengeDetailModal";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

export interface AdminSearchResult {
  value: string;
  type: "email" | "uuid" | "challengeId";
}

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class AdminSearchPage extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const params: any = this.props.match.params;
    const result = parseSearchQuery(params.query);
    const isDark = this.props.userSettings.appTheme === "dark";

    return (
      <PageContainer>
        <h2>Search Results</h2>
        {result ? (
          <>
            <SummaryText>
              Displaying results for search query{" "}
              <i
                style={{
                  color: isDark ? COLORS.SECONDARY_YELLOW : COLORS.PURPLE,
                }}
              >
                {params.query}
              </i>
              , identified as <b>{result.type}</b>.
            </SummaryText>
            {this.renderSearchResult(result)}
          </>
        ) : params.query ? (
          <SummaryText>
            <i>{params.query}</i> is an invalid search query.
          </SummaryText>
        ) : (
          <SummaryText>
            Some details are searchable. Press <Code>⌘+P</Code> and search for a
            user <CodeText>email</CodeText>, <CodeText>uuid</CodeText>, or{" "}
            <CodeText>challengeId</CodeText>.
          </SummaryText>
        )}
      </PageContainer>
    );
  }

  renderSearchResult = (result: AdminSearchResult) => {
    const { users, userSettings, challengeMap, challengeBlobCache } =
      this.props;
    const theme = userSettings.appTheme;

    const matchValues = (a: string, b: string) => {
      if (!a || !b) {
        return false;
      } else {
        return a.toLowerCase() === b.toLowerCase();
      }
    };

    switch (result.type) {
      case "email": {
        const user = users.find((u) => matchValues(u.email, result.value));
        if (user) {
          return (
            <AdminUserComponent
              user={user}
              theme={theme}
              challengeBlobCache={challengeBlobCache}
            />
          );
        } else {
          return <p>No user could be found with this email.</p>;
        }
      }
      case "uuid": {
        const user = users.find((u) => matchValues(u.uuid, result.value));
        if (user) {
          return (
            <AdminUserComponent
              user={user}
              theme={theme}
              challengeBlobCache={challengeBlobCache}
            />
          );
        } else {
          return (
            <p>
              No user could be found with this uuid. Note that non-user uuid
              searches are not supported.
            </p>
          );
        }
      }
      case "challengeId": {
        if (!challengeMap) {
          return <p>Loading challenges...</p>;
        }

        const id = result.value;
        if (id in challengeMap) {
          const mapItem = challengeMap[id];
          return (
            <ChallengeContextCard
              {...mapItem}
              isMobile={isMobile}
              challengeMetaMap={this.props.challengeMetaMap}
            />
          );
        } else {
          return (
            <p>
              No challenge could be found with this id. It could be a module or
              course id (not supported for search by id).
            </p>
          );
        }
      }
      default: {
        assertUnreachable(result.type);
      }
    }
  };
}

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  users: Modules.selectors.users.usersState(state).users,
  userSettings: Modules.selectors.admin.adminUserSettings(state),
  challengeMap: Modules.selectors.challenges.getChallengeMap(state),
  challengeMetaMap: Modules.selectors.challenges.challengeMetaMap(state),
  challengeBlobCache: Modules.selectors.challenges.challengeBlobCache(state),
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
  withRouter(AdminSearchPage),
);
