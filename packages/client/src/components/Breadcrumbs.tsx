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
      <div style={{ marginTop: 8 }}>
        <Breadcrumbs
          items={crumbs}
          currentBreadcrumbRenderer={this.renderCurrentBreadcrumb}
        />
      </div>
    );
  }

  getBreadcrumbs = (breadcrumbsPath: string[]) => {
    const { type } = this.props;
    const crumbs: IBreadcrumbProps[] = [];

    crumbs.push({
      icon: "projects",
      text: breadcrumbsPath[0],
      // className: "breadcrumb-path",
    });

    crumbs.push({
      icon: "folder-open",
      text: breadcrumbsPath[1],
      // className: "breadcrumb-path",
    });

    if (type === "workspace") {
      crumbs.push({
        icon: "application",
        text: breadcrumbsPath[2],
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
