import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";
import { IBreadcrumbProps, Breadcrumb, Breadcrumbs } from "@blueprintjs/core";

/** ===========================================================================
 * Component
 * ============================================================================
 */

class BreadcrumbsPath extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const { breadcrumbsPath } = this.props;
    if (!breadcrumbsPath) {
      return null;
    }

    const crumbs = this.getBreadcrumbs(breadcrumbsPath);

    return (
      <Breadcrumbs
        items={crumbs}
        currentBreadcrumbRenderer={this.renderCurrentBreadcrumb}
      />
    );
  }

  getBreadcrumbs = (breadcrumbsPath: string[]) => {
    const { type } = this.props;
    const crumbs: IBreadcrumbProps[] = [];

    crumbs.push({
      icon: "folder-close",
      text: breadcrumbsPath[0],
    });

    crumbs.push({
      icon: "document",
      text: breadcrumbsPath[1],
    });

    if (type === "workspace") {
      crumbs.push({
        icon: "applications",
        text: breadcrumbsPath[3],
      });
    }

    return crumbs;
  };

  renderCurrentBreadcrumb = ({ text, ...restProps }: IBreadcrumbProps) => {
    // Customize rendering of last breadcrumb
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
