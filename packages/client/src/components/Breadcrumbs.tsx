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

    const BREADCRUMBS: IBreadcrumbProps[] = breadcrumbsPath.map(path => ({
      // icon: "slash",
      text: path,
    }));

    const renderCurrentBreadcrumb = ({
      text,
      ...restProps
    }: IBreadcrumbProps) => {
      // Customize rendering of last breadcrumb
      return (
        <Breadcrumb current {...restProps}>
          {text}
        </Breadcrumb>
      );
    };

    return (
      <Breadcrumbs
        items={BREADCRUMBS}
        currentBreadcrumbRenderer={renderCurrentBreadcrumb}
      />
    );
  }
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
