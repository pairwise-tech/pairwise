import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { CourseSkeleton, getChallengeSlug } from "@pairwise/common";
import { Button, Card, Elevation } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text, PageTitle } from "./SharedComponents";
import { COLORS, MOBILE } from "tools/constants";
import SEO from "./SEO";
import { defaultTextColor, themeColor, themeText } from "./ThemeContainer";
import { YoutubeEmbed } from "./MediaArea";

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class Home extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const {
      userCourseProgressSummary,
      hasPurchasedTypeScriptCourse,
      currentNavigationOverlayCourse,
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
            <YoutubeEmbed url="https://www.youtube.com/embed/d2DShyE37T4" />
            {hasPurchasedTypeScriptCourse ? (
              <ContentText>
                Thank you for purchasing the Pairwise Course! Please enjoy the
                content and good luck in your journey learning to code.
              </ContentText>
            ) : (
              <>
                <ContentTitle>What is Pairwise?</ContentTitle>
                <ContentText>
                  Pairwise is an online platform where you can learn to code by
                  solving challenges and building projects.
                </ContentText>
                <ContentTitle>What will I learn?</ContentTitle>
                <ContentText>
                  You will learn the most popular, in-demand fullstack web
                  development stack: TypeScript, React, NodeJS/Express, and
                  Postgres.
                </ContentText>
                <ContentTitle>How much does it cost?</ContentTitle>
                <ContentText>
                  The first three modules covering HTML, CSS, and TypeScript are
                  free. The remaining course currently costs only $50.
                </ContentText>
                <ContentTitle>
                  How is this different from other platforms?
                </ContentTitle>
                <ContentText>
                  Pairwise combines everything you need to learn to get a job
                  into a single curriculum, which is comprised of hands-on
                  challenges and projects. Think of it like a coding bootcamp at
                  a fraction of the cost.
                </ContentText>
              </>
            )}
            {/* Hidden for now: */}
            {/* {this.props.skeletons?.map(this.renderCourseItem)} */}
          </ContentContainer>
          <CourseProgressContainer>
            {userCourseProgressSummary && currentNavigationOverlayCourse && (
              <>
                <PageTitle>Course Progress</PageTitle>
                {this.renderTypeScriptCourseButtonBox()}
                <ContentText>
                  You have completed {userCourseProgressSummary.totalCompleted}{" "}
                  out of {userCourseProgressSummary.totalChallenges} challenges
                  in the <b>{currentNavigationOverlayCourse.title} Course</b>.
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

  renderTypeScriptCourseButtonBox = () => {
    const { user, skeletons, challengeMap } = this.props;
    const { payments, lastActiveChallengeIds } = user;
    const skeleton = skeletons?.find((c) => c.id === "fpvPtfu7s");

    if (!skeleton || !user.profile) {
      return null;
    }

    const paidForCourse = payments?.find((p) => p.courseId === skeleton.id);
    const firstCourseChallenge = skeleton.modules[0].challenges[0];
    const isCourseFree = skeleton.free;
    const canAccessCourse = paidForCourse || isCourseFree;
    const courseId = skeleton.id;
    const { hasCoachingSession } = user.profile;

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

    return canAccessCourse ? (
      <>
        <Link id={`course-link-0-start`} to={`workspace/${slug}`}>
          <Button
            large
            intent="success"
            style={{ width: 250 }}
            className="courseLinkContinue"
          >
            {lastActiveChallengeExists ? "Resume Course" : "Start Now"}
          </Button>
        </Link>
        {hasCoachingSession && (
          <SpecialBox>
            <p style={{ margin: 0 }}>
              You currently have a 30 minute career coaching session with a
              professional developer! To schedule this at anytime reach out to
              us at{" "}
              <a target="__blank" href="mailto:coaching@pairwise.tech">
                <b>coaching@pairwise.tech</b>
              </a>
              .
            </p>
          </SpecialBox>
        )}
      </>
    ) : (
      <>
        <ButtonsBox>
          <Link id={`course-link-0-start`} to={`workspace/${slug}`}>
            <Button large intent="success">
              {lastActiveChallengeExists
                ? "Resume Course"
                : "Start Now for Free"}
            </Button>
          </Link>
          <Button
            large
            id={`course-link-0-purchase`}
            onClick={this.handlePurchaseCourse(skeleton.id)}
          >
            Purchase Course
          </Button>
        </ButtonsBox>
        <SpecialBox>
          <p style={{ margin: 0 }}>
            Pairwise is currently offering a special deal to early adopters like
            yourself. If you purchase the course now you will also get a
            complimentary 30 minute coaching session with a professional
            developer.
          </p>
        </SpecialBox>
      </>
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
  ${themeColor("background", COLORS.PROGRESS_BACKGROUND, COLORS.GRAY)}
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
  ${themeColor("background", COLORS.TEXT_DARK, COLORS.GRAY)}
`;

const ModuleProgressPercentage = styled.div`
  width: 50px;
  padding-top: 3px;
  padding-left: 3px;
  padding-bottom: 3px;
  ${themeColor("background", COLORS.PROGRESS_BACKGROUND, COLORS.WHITE)}
`;

const ContentText = styled(Text)`
  margin-top: 14px;
`;

const ContentTitle = styled(ContentText)`
  font-weight: bold;
  ${themeColor("color", COLORS.TEXT_WHITE)}
`;

const CourseTitle = styled.h2`
  margin-top: 10px;
  ${defaultTextColor};
`;

const Bold = styled.b`
  ${defaultTextColor};
`;

const PaymentText = styled(Bold)`
  ${themeText(COLORS.SECONDARY_YELLOW, COLORS.PRIMARY_BLUE)};
`;

const CourseDescription = styled.p`
  margin-top: 16px;
  font-size: 14px;
  font-weight: 100;
  letter-spacing: 1px;
  font-size: 18px;
  ${defaultTextColor};
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
    flex: 1 100%;
    display: block;
    text-align: center;

    &:not(:last-child) {
      margin-right: 20px;

      @media ${MOBILE} {
        margin-right: 0px;
        margin-bottom: 20px;
      }
    }
  }
`;

const SpecialBox = styled.div`
  margin-top: 12px;
  padding: 8px;
  border: 1px solid ${COLORS.SECONDARY_YELLOW};
  border-radius: 4px;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  skeletons: Modules.selectors.challenges.getCourseSkeletons(state),
  challengeMap: Modules.selectors.challenges.getChallengeMap(state),
  currentNavigationOverlayCourse:
    Modules.selectors.challenges.getCurrentNavigationOverlayCourseSkeleton(
      state,
    ),
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
