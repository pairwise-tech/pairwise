import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { CourseSkeleton } from "@pairwise/common";
import { Button, Card, Elevation } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text, PageTitle, ExternalLink } from "./Shared";
import { COLORS, PROSE_MAX_WIDTH } from "tools/constants";
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
    const { payments } = this.props.user;
    const paidForCourse = payments?.find(p => p.courseId === skeleton.id);
    const firstCourseChallenge = skeleton.modules[0].challenges[0];
    const isCourseFree = skeleton.free;
    const canAccessCourse = paidForCourse || isCourseFree;

    if (!firstCourseChallenge) {
      return null;
    }

    return (
      <Card
        key={skeleton.id}
        className="course-card"
        elevation={Elevation.FOUR}
        style={{ width: 515, marginTop: 24 }}
      >
        <CourseTitle className={`courseLink`}>{skeleton.title}</CourseTitle>
        <CourseDescription>{skeleton.description}</CourseDescription>
        {canAccessCourse ? (
          <Link to={`workspace/${firstCourseChallenge.id}`}>
            <Button
              large
              intent="success"
              className={`courseLinkContinue`}
              style={{ width: 185, marginTop: 8 }}
            >
              Start Now
            </Button>
          </Link>
        ) : (
          <ButtonsBox>
            <Link to={`workspace/${firstCourseChallenge.id}`}>
              <Button
                large
                intent="success"
                style={{ width: 185 }}
                id={`course-link-${i}-start`}
              >
                Start Now For Free
              </Button>
            </Link>
            <Button
              large
              intent="success"
              id={`course-link-${i}-purchase`}
              style={{ marginLeft: 16, width: 185 }}
              onClick={this.handlePurchaseCourse(skeleton.id)}
            >
              Purchase Course
            </Button>
          </ButtonsBox>
        )}
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
