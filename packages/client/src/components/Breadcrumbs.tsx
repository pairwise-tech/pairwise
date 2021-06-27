import styled from "styled-components/macro";
import isMobile from "is-mobile";
import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";
import { Breadcrumb, Breadcrumbs, BreadcrumbProps } from "@blueprintjs/core";
import { Tooltip2 } from "@blueprintjs/popover2";
import { CHALLENGE_TYPE } from "@pairwise/common";
import { COLORS } from "tools/constants";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

type BreadcrumbsChallengeType = "workspace" | "media";

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
    const {
      type,
      challenge,
      panelId = "",
      toggleCollapsed,
      breadcrumbsPath,
    } = this.props;

    if (!breadcrumbsPath || !challenge) {
      return null;
    }

    const IS_PAID = challenge.isPaidContent;
    const CAN_COLLAPSE = typeof toggleCollapsed === "function";

    return (
      <BreadcrumbsBar
        type={type}
        canCollapse={CAN_COLLAPSE}
        id={panelId}
        onClick={() => {
          if (!IS_PAID && typeof toggleCollapsed === "function") {
            toggleCollapsed();
          }
        }}
      >
        {IS_PAID && (
          <Tooltip2
            usePortal={false}
            position="bottom"
            content={
              <TooltipText>
                <span aria-label="warning emoji" role="img">
                  ⚠️
                </span>{" "}
                This is part of the paid course content. Purchase the course to
                lock in access. Click the label for details.
              </TooltipText>
            }
          >
            <PaidContentLabel
              id="paid-content-label"
              onClick={this.handlePurchaseCourse}
            >
              Paid Content
            </PaidContentLabel>
          </Tooltip2>
        )}
        <Breadcrumbs
          items={this.getBreadcrumbs(breadcrumbsPath)}
          currentBreadcrumbRenderer={this.renderCurrentBreadcrumb}
        />
      </BreadcrumbsBar>
    );
  }

  getBreadcrumbs = (breadcrumbs: BreadcrumbsData) => {
    const { type, isCurrentChallengeComplete } = this.props;
    const crumbs: BreadcrumbProps[] = [];

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

    if (this.props.isInstructionsViewCollapsed) {
      return [crumbs[crumbs.length - 1]];
    }

    return crumbs;
  };

  // Customize rendering of the last breadcrumb
  renderCurrentBreadcrumb = ({ text, ...restProps }: BreadcrumbProps) => {
    const icon = this.props.isInstructionsViewCollapsed
      ? "caret-down"
      : restProps.icon;

    return (
      <Breadcrumb
        current={this.props.type === "workspace"}
        {...restProps}
        icon={icon}
      >
        {text}
      </Breadcrumb>
    );
  };

  handlePurchaseCourse = () => {
    const { courseId } = this.props;
    if (!courseId) {
      return;
    }

    this.props.handlePaymentCourseIntent({ courseId, showToastWarning: true });
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const BreadcrumbsBar = styled.div<{
  canCollapse: boolean;
  type: BreadcrumbsChallengeType;
}>`
  width: 100%;
  font-weight: normal;
  margin-bottom: 10px;
  margin-top: ${(props) => (props.type === "media" ? 10 : 0)}px;

  .bp3-breadcrumb {
    :hover {
      cursor: ${(props) => (props.canCollapse ? "pointer" : "default")};
    }
  }
`;

const PaidContentLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  height: 14px;
  width: 90px;
  font-weight: bold;
  letter-spacing: 1.2px;
  color: ${COLORS.TEXT_DARK};
  background: ${COLORS.SECONDARY_YELLOW};
  padding: 2px 4px;
  box-shadow: 0 0 20px rgb(0, 0, 0);
  border-radius: 100px;

  :hover {
    cursor: pointer;
  }
`;

const TooltipText = styled.p`
  margin: 0;
  font-size: 14px;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  courseId: Modules.selectors.challenges.getCurrentCourseId(state),
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  breadcrumbsPath: Modules.selectors.challenges.breadcrumbPathSelector(state),
  isInstructionsViewCollapsed:
    Modules.selectors.challenges.isInstructionsViewCollapsed(state),
  isCurrentChallengeComplete:
    Modules.selectors.challenges.isCurrentChallengeComplete(state),
});

const dispatchProps = {
  handlePaymentCourseIntent: Modules.actions.payments.handlePaymentCourseIntent,
};

interface ComponentProps {
  type: BreadcrumbsChallengeType;
  panelId?: string;
  toggleCollapsed?: () => void;
}

type IProps = ComponentProps &
  ReturnType<typeof mapStateToProps> &
  typeof dispatchProps;

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default connect(mapStateToProps, dispatchProps)(BreadcrumbsPath);
