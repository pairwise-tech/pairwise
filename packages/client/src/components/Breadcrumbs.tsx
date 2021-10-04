import styled from "styled-components/macro";
import isMobile from "is-mobile";
import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";
import {
  Icon,
  Button,
  Breadcrumb,
  Breadcrumbs,
  BreadcrumbProps,
} from "@blueprintjs/core";
import { Tooltip2 } from "@blueprintjs/popover2";
import {
  AppTheme,
  Challenge,
  CHALLENGE_TYPE,
  PortfolioSkills,
} from "@pairwise/common";
import { COLORS, DESKTOP, PROSE_MAX_WIDTH } from "tools/constants";
import {
  capitalize,
  isAlternateLanguageChallenge,
  mapSkillToDeviconClassName,
} from "../tools/utils";

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
      appTheme,
      challenge,
      panelId = "",
      isMobileView,
      toggleCollapsed,
      breadcrumbsPath,
      displaySkillIcon,
      isInstructionsViewCollapsed,
      hideInstructionsModalButton,
      setChallengeInstructionsModalState,
    } = this.props;

    if (!breadcrumbsPath || !challenge) {
      return null;
    }

    const CAN_COLLAPSE = typeof toggleCollapsed === "function";
    const IS_ALTERNATE_LANGUAGE = isAlternateLanguageChallenge(challenge);

    const handleClickTitle = () => {
      if (typeof toggleCollapsed === "function") {
        toggleCollapsed();
      }
    };

    return (
      <BreadcrumbsBar type={type} id={panelId} canCollapse={CAN_COLLAPSE}>
        {IS_ALTERNATE_LANGUAGE && !isInstructionsViewCollapsed && (
          <Tooltip2
            usePortal={false}
            position="bottom"
            content={
              <TooltipText>
                <span aria-label="warning emoji" role="img">
                  ⚠️
                </span>{" "}
                {capitalize(challenge.type)} challenges are experimental and
                still under development.
              </TooltipText>
            }
          >
            <ContentLabel>New Content</ContentLabel>
          </Tooltip2>
        )}
        <Horizontal>
          <div onClick={handleClickTitle}>
            <Breadcrumbs
              items={this.getBreadcrumbs(breadcrumbsPath)}
              currentBreadcrumbRenderer={this.renderCurrentBreadcrumb}
            />
          </div>
          <Row>
            {!isMobileView && displaySkillIcon && (
              <ChallengeSkillIcons
                isEditMode={false}
                appTheme={appTheme}
                challenge={challenge}
              />
            )}
            {!isMobileView && !hideInstructionsModalButton && (
              <Tooltip2
                position="bottom"
                content="View challenge instructions in a modal."
              >
                <Button
                  style={{ marginLeft: 4 }}
                  onClick={() => setChallengeInstructionsModalState(true)}
                >
                  <Icon iconSize={16} icon="search" />
                </Button>
              </Tooltip2>
            )}
          </Row>
        </Horizontal>
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

interface BreadcrumbsBarProps {
  canCollapse: boolean;
  type: BreadcrumbsChallengeType;
}

const BreadcrumbsBar = styled.div<BreadcrumbsBarProps>`
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

const Horizontal = styled.div`
  display: flex;
  align-items: flex-end;
  flex-direction: row;
  justify-content: space-between;

  @media ${DESKTOP} {
    max-width: ${PROSE_MAX_WIDTH}px;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: flex-end;
  flex-direction: row;
`;

export const ChallengeSkillIcons = (props: {
  isEditMode: boolean;
  appTheme: AppTheme;
  challenge: Challenge;
}) => {
  const { isEditMode, appTheme, challenge } = props;
  return (
    <>
      {challenge.skillTags &&
        challenge.skillTags.map((skill) => (
          <SkillIcon
            key={skill}
            skill={skill}
            appTheme={appTheme}
            isEditMode={isEditMode}
          />
        ))}
    </>
  );
};

/**
 * Render skill icons for each challenge. These are not displayed on mobile.
 */
const SkillIcon = (props: {
  isEditMode: boolean;
  appTheme: AppTheme;
  skill: PortfolioSkills;
}) => {
  const { skill, appTheme, isEditMode } = props;
  const className = mapSkillToDeviconClassName(skill, appTheme);

  return (
    <Tooltip2
      position="bottom"
      content={
        isEditMode
          ? "Choose skill tag(s) for this challenge. Tags added at the module level will be inherited by all child challenges."
          : `Solving this challenge earns ${skill} skills.`
      }
    >
      <Centered>
        <i
          style={{
            fontSize: 20,
            marginRight: 1,
            marginBottom: 5,
          }}
          className={className}
        />
      </Centered>
    </Tooltip2>
  );
};

const ContentLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  height: 14px;
  width: 95px;
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

const Centered = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
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
  appTheme: Modules.selectors.user.userSettings(state).appTheme,
});

const dispatchProps = {
  handlePaymentCourseIntent: Modules.actions.payments.handlePaymentCourseIntent,
  setChallengeInstructionsModalState:
    Modules.actions.challenges.setChallengeInstructionsModalState,
};

interface ComponentProps {
  type: BreadcrumbsChallengeType;
  panelId?: string;
  isMobileView: boolean;
  displaySkillIcon?: boolean;
  hideInstructionsModalButton?: boolean;
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
