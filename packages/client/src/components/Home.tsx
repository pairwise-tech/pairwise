import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { CourseSkeleton } from "@pairwise/common";
import { Button, Card, Elevation } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text, PageTitle, ExternalLink } from "./Shared";
import { COLORS, PROSE_MAX_WIDTH, MOBILE } from "tools/constants";
import SEO from "./SEO";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {}

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class Home extends React.Component<IProps, IState> {
  render(): Nullable<JSX.Element> {
    return (
      <PageContainer>
        <SEO
          title={"Welcome to Pairwise"}
          description={"Learn to code with hands-on challenges and projects"}
        />
        <ContentContainer>
          <PageTitle>Welcome to Pairwise!</PageTitle>
          <ContentText>
            Pairwise is a platform where you can learn to code and build a
            portfolio of projects to get hired as a software developer. It's
            free to get started with no signup required, and the HTML and
            programming course is free for anyone to complete. You can easily
            create an account anytime to track your progress.
          </ContentText>
          <ContentText>
            To learn more about our product and courses, take a look at our{" "}
            <ExternalLink link="https://pairwise.tech">
              Product Page
            </ExternalLink>
            .
          </ContentText>
          <BoldText>Select a course below to get started now!</BoldText>
        </ContentContainer>
        <PageTitle>Content</PageTitle>
        {this.props.skeletons?.map(this.renderCourseItem)}
      </PageContainer>
    );
  }

  renderCourseItem = (skeleton: CourseSkeleton, i: number) => {
    const { payments, lastActiveChallengeIds } = this.props.user;
    const paidForCourse = payments?.find(p => p.courseId === skeleton.id);
    const firstCourseChallenge = skeleton.modules[0].challenges[0];
    const isCourseFree = skeleton.free;
    const canAccessCourse = paidForCourse || isCourseFree;
    const courseId = skeleton.id;

    if (!firstCourseChallenge) {
      return null;
    }

    // Determine the course challenge to link to
    let lastActiveChallengeExists = false;
    let courseChallengeLinkId = firstCourseChallenge.id;
    if (courseId in lastActiveChallengeIds) {
      lastActiveChallengeExists = true;
      courseChallengeLinkId = lastActiveChallengeIds[courseId];
    }

    return (
      <Card
        key={skeleton.id}
        className="course-card"
        elevation={Elevation.FOUR}
        style={{ maxWidth: 515, marginTop: 24 }}
      >
        <CourseTitle className="courseLink">{skeleton.title}</CourseTitle>
        <CourseDescription>{skeleton.description}</CourseDescription>
        <ButtonsBox>
          {canAccessCourse ? (
            <Link
              id={`course-link-${i}-start`}
              to={`workspace/${courseChallengeLinkId}`}
            >
              <Button large intent="success" className="courseLinkContinue">
                {lastActiveChallengeExists
                  ? "Continue the Course"
                  : "Start Now"}
              </Button>
            </Link>
          ) : (
            <>
              <Link
                id={`course-link-${i}-start`}
                to={`workspace/${courseChallengeLinkId}`}
              >
                <Button large intent="success">
                  {lastActiveChallengeExists
                    ? "Continue the Course"
                    : "Start Now for Free"}
                </Button>
              </Link>
              <Button
                large
                intent="success"
                id={`course-link-${i}-purchase`}
                onClick={this.handlePurchaseCourse(skeleton.id)}
              >
                Purchase Course
              </Button>
            </>
          )}
        </ButtonsBox>
      </Card>
    );
  };

  handlePurchaseCourse = (courseId: string) => () => {
    this.props.handlePaymentCourseIntent({ courseId });
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const ContentContainer = styled.div`
  max-width: ${PROSE_MAX_WIDTH - 250}px;
  margin-bottom: 24px;

  p {
    font-size: 18px;
  }
`;

const ContentText = styled(Text)`
  margin-top: 14px;
`;

const CourseTitle = styled.h2`
  margin-top: 10px;
  color: ${COLORS.TEXT_WHITE};
`;

const CourseDescription = styled.p`
  margin-top: 16px;
  font-size: 14px;
  font-weight: 100;
  letter-spacing: 1px;
  color: white;
  font-size: 18px;
`;

const ButtonsBox = styled.div`
  margin-top: 18px;
  display: flex;
  justify-content: space-between;

  @media ${MOBILE} {
    display: block;
  }

  button {
    width: 100%;
  }

  & > button,
  & > a {
    display: block;
    text-align: center;
    flex: 1 100%;
    &:not(:last-child) {
      margin-right: 20px;
      @media ${MOBILE} {
        margin-right: 0px;
        margin-bottom: 20px;
      }
    }
  }
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

const dispatchProps = {
  handlePaymentCourseIntent: Modules.actions.payments.handlePaymentCourseIntent,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(Home);
