import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Button, Icon } from "@blueprintjs/core";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text, PageTitle } from "./SharedComponents";
import { COLORS } from "tools/constants";
import { themeColor } from "./ThemeContainer";
import {
  AppTheme,
  PortfolioSkills,
  portfolioSkillsList,
  assertUnreachable,
  PortfolioSkillSummary,
} from "@pairwise/common";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {}

/** ===========================================================================
 * Account
 * ============================================================================
 */

class Portfolio extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {};
  }

  componentDidMount() {}

  render(): Nullable<JSX.Element> {
    const { userPortfolioSkillsSummary, appTheme } = this.props;

    if (userPortfolioSkillsSummary === null) {
      return null;
    }

    return (
      <PageContainer>
        <PageTitle>Portfolio and Skills</PageTitle>
        <Subtitle>
          Skills are acquired by completing challenges and projects.
        </Subtitle>
        <SkillContainer>
          {portfolioSkillsList.map((skill) => {
            return (
              <PortfolioSkill
                key={skill}
                skill={skill}
                theme={appTheme}
                summary={userPortfolioSkillsSummary[skill]}
              />
            );
          })}
        </SkillContainer>
      </PageContainer>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

interface PortfolioSkillProps {
  skill: PortfolioSkills;
  theme: AppTheme;
  summary: PortfolioSkillSummary;
}

export const PortfolioSkill = (props: PortfolioSkillProps) => {
  const { skill, theme, summary } = props;
  const { total, accomplished } = summary;
  const percentComplete =
    accomplished === 0 ? 0 : ((accomplished / total) * 100).toFixed(2);

  const deviconClassName = mapSkillToDeviconClassName(skill, theme);
  return (
    <Skill>
      <Devicon>
        <i className={deviconClassName}></i>
      </Devicon>
      <SkillInfo>
        <SkillTitle>{skill}</SkillTitle>
        <SkillDescription>{percentComplete}% complete</SkillDescription>
      </SkillInfo>
    </Skill>
  );
};

const SkillContainer = styled.div`
  margin-top: 16px;
`;

const Devicon = styled.div`
  width: 95px;
  display: flex;
  align-items: center;
  justify-content: center;

  i {
    font-size: 50px;
  }
`;

const Skill = styled.div`
  margin-top: 6px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  width: 250px;
  height: 75px;
  padding: 8px;
  border-radius: 5px;
  background: rgba(5, 5, 5, 0.25);
`;

const SkillInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const SkillTitle = styled.p`
  margin: 2px;
  font-weight: bold;
`;

const SkillDescription = styled.p`
  margin: 2px;
`;

const Subtitle = styled(Text)`
  font-size: 18px;
  margin-top: 12px;

  ${themeColor("color", COLORS.TEXT_CONTENT_BRIGHT)};
`;

/** ===========================================================================
 * Utils
 * ============================================================================
 */

const mapSkillToDeviconClassName = (
  skill: PortfolioSkills,
  theme: AppTheme,
): string => {
  const isDark = theme === "dark";

  switch (skill) {
    case PortfolioSkills.HTML:
      return "devicon-html5-plain colored";

    case PortfolioSkills.CSS:
      return "devicon-css3-plain colored";

    case PortfolioSkills.TypeScript:
      return "devicon-typescript-plain colored";

    case PortfolioSkills.Git:
      return "devicon-git-plain colored";

    case PortfolioSkills.GitHub:
      if (isDark) {
        return "devicon-github-original-wordmark";
      } else {
        return "devicon-github-original-wordmark colored";
      }

    case PortfolioSkills.React:
      return "devicon-react-original colored";

    case PortfolioSkills.NodeJS:
      return "devicon-nodejs-plain colored";

    case PortfolioSkills.Express:
      if (isDark) {
        return "devicon-express-original-wordmark";
      } else {
        return "devicon-express-original-wordmark colored";
      }

    case PortfolioSkills.PostgreSQL:
      return "devicon-postgresql-plain-wordmark colored";

    case PortfolioSkills.Jest:
      return "devicon-jest-plain colored";

    case PortfolioSkills.Docker:
      return "devicon-docker-plain-wordmark colored";

    default:
      assertUnreachable(skill);
  }
};

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  userPortfolioSkillsSummary:
    Modules.selectors.challenges.userPortfolioSkillsSummary(state),
  appTheme: Modules.selectors.user.userSettings(state).appTheme,
});

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(Portfolio);
