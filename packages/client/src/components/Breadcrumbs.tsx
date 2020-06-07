import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";
import { IBreadcrumbProps, Breadcrumb, Breadcrumbs } from "@blueprintjs/core";

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
      <div style={{ marginTop: 10 }}>
        <Breadcrumbs
          items={this.getBreadcrumbs(breadcrumbsPath)}
          currentBreadcrumbRenderer={this.renderCurrentBreadcrumb}
        />
      </div>
    );
  }

  getBreadcrumbs = (breadcrumbsPath: string[]) => {
    const { type, isCurrentChallengeComplete } = this.props;
    const crumbs: IBreadcrumbProps[] = [];

    // Get each breadcrumb
    const [moduleCrumb, sectionCrumb, challengeCrumb] = breadcrumbsPath;

    /**
     * Assemble the breadcrumbs:
     */

    crumbs.push({
      text: moduleCrumb,
      icon: "projects",
    });

    crumbs.push({
      text: sectionCrumb,
      icon: "folder-open",
    });

    if (type === "workspace") {
      crumbs.push({
        text: challengeCrumb,
        icon: isCurrentChallengeComplete ? "tick" : "code",
        className: isCurrentChallengeComplete
          ? "breadcrumb-challenge-complete"
          : "",
      });
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
