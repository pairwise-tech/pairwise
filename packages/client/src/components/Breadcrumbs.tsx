import isMobile from "is-mobile";
import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";
import { IBreadcrumbProps, Breadcrumb, Breadcrumbs } from "@blueprintjs/core";
import { CHALLENGE_TYPE } from "@pairwise/common";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface Breadcrumb {
  title: string;
  type: CHALLENGE_TYPE | "module";
}

export interface BreadcrumbsData {
  module: Breadcrumb;
  section: Nullable<Breadcrumb>;
  challenge: Nullable<Breadcrumb>;
}

/** ===========================================================================
 * Breadcrumbs Component
 * ---------------------------------------------------------------------------
 * Renders the module > section > challenge title breadcrumbs for a given
 * challenge.
 * ============================================================================
 */

class BreadcrumbsPath extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const { breadcrumbsPath } = this.props;
    if (!breadcrumbsPath) {
      return null;
    }

    return (
      <div style={{ width: "100%", marginTop: 10, marginBottom: 10 }}>
        <Breadcrumbs
          items={this.getBreadcrumbs(breadcrumbsPath)}
          currentBreadcrumbRenderer={this.renderCurrentBreadcrumb}
        />
      </div>
    );
  }

  getBreadcrumbs = (breadcrumbs: BreadcrumbsData) => {
    const { type, isCurrentChallengeComplete } = this.props;
    const crumbs: IBreadcrumbProps[] = [];

    // Get each breadcrumb
    const { module, section, challenge } = breadcrumbs;

    /**
     * Assemble the breadcrumbs:
     */

    crumbs.push({
      text: module.title,
      icon: "projects",
    });

    if (section) {
      crumbs.push({
        text: section.title,
        icon: "folder-open",
      });
    }

    if (type === "workspace" && challenge) {
      // NOTE: The challenge type is available in the breadcrumb if we wanted
      // to render a more specific icon for challenges based on the their
      // type in the future.
      crumbs.push({
        text: challenge.title,
        icon: isCurrentChallengeComplete ? "tick" : "code",
        className: isCurrentChallengeComplete
          ? "breadcrumb-challenge-complete"
          : "",
      });
    }

    // On mobile truncate workspace breadcrumbs to only show the challenge
    if (type === "workspace" && isMobile()) {
      return crumbs.slice(2);
    }

    return crumbs;
  };

  renderCurrentBreadcrumb = ({ text, ...restProps }: IBreadcrumbProps) => {
    // Customize rendering of the last breadcrumb
    return (
      <Breadcrumb current={this.props.type === "workspace"} {...restProps}>
        {text}
      </Breadcrumb>
    );
  };
}

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  breadcrumbsPath: Modules.selectors.challenges.breadcrumbPathSelector(state),
  isCurrentChallengeComplete: Modules.selectors.challenges.isCurrentChallengeComplete(
    state,
  ),
});

const dispatchProps = {};

interface ComponentProps {
  type: "workspace" | "media";
}

type IProps = ComponentProps &
  ReturnType<typeof mapStateToProps> &
  typeof dispatchProps;

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default connect(mapStateToProps, dispatchProps)(BreadcrumbsPath);
