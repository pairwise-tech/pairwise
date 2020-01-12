import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { CourseSkeleton } from "@pairwise/common";
import { Card, Elevation } from "@blueprintjs/core";
import { Link } from "react-router-dom";

import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text, PageTitle } from "./file";
import { COLORS } from "tools/constants";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {}

/** ===========================================================================
 * App
 * ============================================================================
 */

class Home extends React.Component<IProps, IState> {
  render(): Nullable<JSX.Element> {
    return (
      <PageContainer>
        <ContentContainer>
          <PageTitle>Welcome to Pairwise!</PageTitle>
          <ContentText>
            Pairwise is a platform where you can learn hirable software
            engineering skills through a series of hands-on challenges and
            projects. It's free to get started with no signup required. You can
            easily create an account anytime to track your progress.
          </ContentText>
          <ContentText>
            To learn more about our product and courses, take a look at our{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://pairwise.tech"
            >
              Product Page
            </a>
            .
          </ContentText>
          <BoldText>Select a course below to get started now!</BoldText>
        </ContentContainer>
        <PageTitle>Courses:</PageTitle>
        {this.props.skeletons?.map(this.renderCourseSkeleton)}
      </PageContainer>
    );
  }

  renderCourseSkeleton = (skeleton: CourseSkeleton) => {
    const firstChallengeId = skeleton.modules[0].challenges[0].id;
    return (
      <Card
        interactive
        key={skeleton.id}
        style={{ width: 450 }}
        className="course-card"
        elevation={Elevation.FOUR}
      >
        <Link to={`workspace/${firstChallengeId}`}>
          <CourseTitle>{skeleton.title}</CourseTitle>
          <CourseDescription>{skeleton.description}</CourseDescription>
        </Link>
      </Card>
    );
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const ContentContainer = styled.div`
  width: 750px;
  margin-bottom: 24px;
`;

const ContentText = styled(Text)`
  margin-top: 14px;
`;

const CourseTitle = styled.h3`
  margin-top: 10px;
  color: ${COLORS.PRIMARY_GREEN};
`;

const CourseDescription = styled.p`
  margin-top: 16px;
  font-size: 14px;
  font-weight: 100;
  color: ${COLORS.TEXT_CONTENT};
`;

const BoldText = styled(CourseDescription)`
  font-weight: 500;
  font-size: 16px;
  color: ${COLORS.TEXT_TITLE};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  skeletons: Modules.selectors.challenges.courseSkeletons(state),
});

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(Home);
