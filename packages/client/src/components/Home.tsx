import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { CourseSkeleton, getChallengeSlug } from "@pairwise/common";
import { Button, Card, Elevation } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text, PageTitle, ExternalLink } from "./Shared";
import { COLORS, PROSE_MAX_WIDTH, MOBILE } from "tools/constants";
import SEO from "./SEO";

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class Home extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    return (
      <PageContainer>
        <SEO
          title="Welcome to Pairwise"
          description="Learn to code with hands-on challenges and projects"
        />
        <ContentContainer>
          <PageTitle>Welcome to Pairwise!</PageTitle>
          <ContentText>
            Pairwise is the best place to learn to code and start a career in
            software development.
          </ContentText>
          <ContentText style={{ fontWeight: "bold", color: COLORS.TEXT_WHITE }}>
            What's the value in Pairwise?
          </ContentText>
          <ContentText>
            Most coding bootcamps cost $10,000 USD or more, while a computer
            science degree from a university is even more expensive and takes
            years to complete.
          </ContentText>
          <ContentText>
            While many free programming education resources exist online, it's
            hard to find a single coherent curriculum to take you from beginner
            to expert. That's what Pairwise is. A single, linear curriculum
            which starts you coding and solving problems from Day 1.
          </ContentText>
          <ContentText style={{ fontWeight: "bold", color: COLORS.TEXT_WHITE }}>
            What do I get?
          </ContentText>
          <ContentText>
            The Pairwise FullStack TypeScript Course is currently in{" "}
            <Bold style={{ textDecoration: "underline " }}>BETA</Bold> and
            available to purchase now for{" "}
            <Bold style={{ color: COLORS.SECONDARY_YELLOW }}>$50 USD</Bold>.
            This includes all of the modules you can view in the course
            navigation menu, and covers HTML & CSS, basic programming, frontend
            and backend development, mobile development, and other skills like
            testing and deploying software.
          </ContentText>
          <ContentText>
            To see more about what you will learn,{" "}
            <ExternalLink link="https://pairwise.tech">go here</ExternalLink>.
          </ContentText>
        </ContentContainer>
        {this.props.skeletons?.map(this.renderCourseItem)}
      </PageContainer>
    );
  }

  renderCourseItem = (skeleton: CourseSkeleton, i: number) => {
    const { user, challengeMap } = this.props;
    const { payments, lastActiveChallengeIds } = user;
    const paidForCourse = payments?.find(p => p.courseId === skeleton.id);
    const firstCourseChallenge = skeleton.modules[0].challenges[0];
    const isCourseFree = skeleton.free;
    const canAccessCourse = paidForCourse || isCourseFree;
    const courseId = skeleton.id;

    if (!firstCourseChallenge) {
      return null;
    }

    /**
     * Determine the url slug for the last active challenge for the course
     * to redirect to.
     *
     * TODO: This could be refactored to a selector.
     */
    let lastActiveChallengeExists = false;
    let courseChallengeLinkId = firstCourseChallenge.id;
    if (courseId in lastActiveChallengeIds) {
      lastActiveChallengeExists = true;
      courseChallengeLinkId = lastActiveChallengeIds[courseId];
    }

    let slug = courseChallengeLinkId;
    if (challengeMap && courseChallengeLinkId in challengeMap) {
      const { challenge } = challengeMap[courseChallengeLinkId];
      slug = getChallengeSlug(challenge);
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
            <Link id={`course-link-${i}-start`} to={`workspace/${slug}`}>
              <Button large intent="success" className="courseLinkContinue">
                {lastActiveChallengeExists ? "Resume Course" : "Start Now"}
              </Button>
            </Link>
          ) : (
            <>
              <Link id={`course-link-${i}-start`} to={`workspace/${slug}`}>
                <Button large intent="success">
                  {lastActiveChallengeExists
                    ? "Resume Course"
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
  max-width: ${PROSE_MAX_WIDTH - 150}px;
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

const Bold = styled.b`
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

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  skeletons: Modules.selectors.challenges.courseSkeletons(state),
  challengeMap: Modules.selectors.challenges.getChallengeMap(state),
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
