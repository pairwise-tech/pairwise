import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { CourseSkeleton, getChallengeSlug } from "@pairwise/common";
import { Button, Card, Elevation } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import Modules, { ReduxStoreState } from "modules/root";
import {
  PageContainer,
  Text,
  PageTitle,
  ExternalLink,
} from "./SharedComponents";
import { COLORS, MOBILE } from "tools/constants";
import SEO from "./SEO";

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class Home extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const {
      currentCourse,
      userCourseProgressSummary,
      hasPurchasedTypeScriptCourse,
    } = this.props;

    return (
      <PageContainer>
        <SEO
          title="Welcome to Pairwise"
          description="Learn to code with hands-on challenges and projects"
        />
        <FlexContainer>
          <ContentContainer style={{ paddingRight: 50, marginBottom: 25 }}>
            <PageTitle>Welcome to Pairwise!</PageTitle>
            {hasPurchasedTypeScriptCourse ? (
              <ContentText>
                Thank you for purchasing the Pairwise Course! Please enjoy the
                content and good luck in your journey learning to code.
              </ContentText>
            ) : (
              <>
                <ContentText
                  style={{ fontWeight: "bold", color: COLORS.TEXT_WHITE }}
                >
                  What is Pairwise?
                </ContentText>
                <ContentText>
                  Pairwise is a single curriculum of challenges and projects
                  which you can use to learn all of the fundamental skills to
                  build modern web and mobile applications.
                </ContentText>
                <ContentText>
                  Most coding bootcamps cost $10,000 USD or more, and a computer
                  science degree from a university is even more expensive and
                  takes years to complete.
                </ContentText>
                <ContentText>
                  Pairwise is the fastest and most affordable way to learn these
                  skills.
                </ContentText>
                <ContentText
                  style={{ fontWeight: "bold", color: COLORS.TEXT_WHITE }}
                >
                  How much does it cost?
                </ContentText>
                <ContentText>
                  The Pairwise FullStack TypeScript Course is currently in{" "}
                  <Bold style={{ textDecoration: "underline " }}>BETA</Bold> and
                  available to purchase now for{" "}
                  <Bold style={{ color: COLORS.SECONDARY_YELLOW }}>
                    $50 USD
                  </Bold>
                  . This includes all of the modules you can view in the course
                  navigation menu, and covers HTML & CSS, basic programming,
                  frontend and backend development, mobile development, and
                  other skills like testing and deploying software.
                </ContentText>
              </>
            )}
            {this.props.skeletons?.map(this.renderCourseItem)}
          </ContentContainer>
          <CourseProgressContainer>
            {userCourseProgressSummary && currentCourse && (
              <>
                <PageTitle>Course Progress</PageTitle>
                <ContentText>
                  You have completed {userCourseProgressSummary.totalCompleted}{" "}
                  out of {userCourseProgressSummary.totalChallenges} challenges
                  in the <b>{currentCourse.title} Course</b>.
                </ContentText>
                <ProgressBar>
                  <ProgressComplete
                    progress={userCourseProgressSummary.percentComplete}
                  />
                </ProgressBar>
                {Array.from(userCourseProgressSummary.summary.entries()).map(
                  ([id, stats]) => {
                    const { title, completed, total } = stats;
                    const percent = total === 0 ? 0 : (completed / total) * 100;
                    return (
                      <ModuleProgressBar key={id}>
                        <ModuleProgressPercentage>
                          {percent.toFixed(0)}%
                        </ModuleProgressPercentage>
                        <ModuleProgressTitle>{title}</ModuleProgressTitle>
                      </ModuleProgressBar>
                    );
                  },
                )}
              </>
            )}
          </CourseProgressContainer>
        </FlexContainer>
      </PageContainer>
    );
  }

  renderCourseItem = (skeleton: CourseSkeleton, i: number) => {
    const { user, challengeMap } = this.props;
    const { payments, lastActiveChallengeIds } = user;
    const paidForCourse = payments?.find((p) => p.courseId === skeleton.id);
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
  flex: 1;

  p {
    font-size: 18px;
  }
`;

const CourseProgressContainer = styled(ContentContainer)`
  @media ${MOBILE} {
    padding-bottom: 25px;
  }
`;

const FlexContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  @media ${MOBILE} {
    flex-direction: column;
  }
`;

const ProgressBar = styled.div`
  height: 30px;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 10px;
  background: ${COLORS.PROGRESS_BACKGROUND};
`;

const ProgressComplete = styled.div<{ progress: number }>`
  height: 30px;
  width: ${(props) => props.progress}%;
  background: ${COLORS.PROGRESS_COMPLETE};
`;

const ModuleProgressBar = styled.div`
  margin-top: 2px;
  display: flex;
  flex-direction: row;
`;

const ModuleProgressTitle = styled.div`
  width: 265px;
  padding-top: 3px;
  padding-left: 5px;
  padding-bottom: 3px;
  background: ${COLORS.TEXT_DARK};
`;

const ModuleProgressPercentage = styled.div`
  width: 50px;
  padding-top: 3px;
  padding-left: 3px;
  padding-bottom: 3px;
  background: ${COLORS.PROGRESS_BACKGROUND};
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
  currentCourse: Modules.selectors.challenges.getCurrentCourse(state),
  skeletons: Modules.selectors.challenges.courseSkeletons(state),
  challengeMap: Modules.selectors.challenges.getChallengeMap(state),
  userCourseProgressSummary:
    Modules.selectors.challenges.userCourseProgressSummary(state),
  hasPurchasedTypeScriptCourse:
    Modules.selectors.user.hasPurchasedTypeScriptCourse(state),
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
