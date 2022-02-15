import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { CourseSkeleton, getChallengeSlug } from "@pairwise/common";
import { Button, Card, Elevation } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text, PageTitle } from "./SharedComponents";
import { COLORS, MOBILE, SUNSET } from "tools/constants";
import SEO from "./SEO";
import {
  defaultTextColor,
  IThemeProps,
  themeColor,
  themeText,
} from "./ThemeContainer";
import { YoutubeEmbed } from "./MediaArea";

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class Home extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const {
      isAuthenticated,
      userCourseProgressSummary,
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
            {SUNSET ? (
              <SpecialBox>
                <p>
                  Pairwise is currently a frontend only application. The full
                  product has been sunset due to a lack of user traction. You
                  can find the open source code on GitHub.
                </p>
              </SpecialBox>
            ) : (
              <YoutubeEmbed
                showSubscribeButton
                url="https://www.youtube.com/embed/M87M_Iy4dAE"
              />
            )}
            <PageTitle>Courses</PageTitle>
            {this.props.skeletons?.map(this.renderCourseItem)}
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
                {isAuthenticated && (
                  <LeaderboardText>
                    See how you stack up against others in the{" "}
                    <Link to="leaderboard">leaderboard</Link>.
                  </LeaderboardText>
                )}
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
              {!SUNSET && (
                <Button
                  large
                  intent="success"
                  id={`course-link-${i}-purchase`}
                  onClick={this.handlePurchaseCourse(skeleton.id)}
                >
                  Purchase Course
                </Button>
              )}
            </>
          )}
        </ButtonsBox>
      </Card>
    );
  };

  renderTypeScriptCourseButtonBox = () => {
    const { user, currentActiveIds, skeletons, challengeMap } = this.props;
    const { payments, lastActiveChallengeIds } = user;
    const skeleton = skeletons?.find(
      (c) => c.id === currentActiveIds.currentCourseId,
    );

    if (!skeleton) {
      return null;
    }

    const paidForCourse = payments?.find((p) => p.courseId === skeleton.id);
    const firstCourseChallenge = skeleton.modules[0].challenges[0];
    const isCourseFree = skeleton.free;
    const canAccessCourse = paidForCourse || isCourseFree;
    const courseId = skeleton.id;
    const hasCoachingSession = user.profile
      ? user.profile.coachingSessions > 0
      : false;

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
      <div>
        <Link id="course-link-0-start" to={`workspace/${slug}`}>
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
              You currently have a career coaching session with a professional
              developer! To schedule this at anytime reach out to us at{" "}
              <a target="__blank" href="mailto:coaching@pairwise.tech">
                <b>coaching@pairwise.tech</b>
              </a>
              .
            </p>
          </SpecialBox>
        )}
      </div>
    ) : (
      <div>
        <ButtonsBox>
          <Link id="course-link-0-start" to={`workspace/${slug}`}>
            <Button large intent="success">
              {lastActiveChallengeExists
                ? "Resume Course"
                : "Start Now for Free"}
            </Button>
          </Link>
          {!SUNSET && (
            <Button
              large
              id="course-link-0-purchase"
              onClick={this.handlePurchaseCourse(skeleton.id)}
            >
              Purchase Course
            </Button>
          )}
        </ButtonsBox>
        {!SUNSET && (
          <SpecialBox>
            <p style={{ margin: 0 }}>
              Pairwise is currently offering a special deal to early adopters
              like yourself. If you purchase the course now you will also get a
              complimentary 30 minute career coaching session with a
              professional developer.
            </p>
          </SpecialBox>
        )}
      </div>
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
  font-size: 18px;
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
  border-radius: 4px;
  border: ${(props: IThemeProps) => {
    const color = props.theme.dark
      ? COLORS.SECONDARY_YELLOW
      : COLORS.SECONDARY_PINK;
    return `1px solid ${color}`;
  }};
`;

const LeaderboardText = styled.p`
  font-size: 16px;
  margin-top: 8px;
  margin-bottom: 8px;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  skeletons: Modules.selectors.challenges.getCourseSkeletons(state),
  challengeMap: Modules.selectors.challenges.getChallengeMap(state),
  isAuthenticated: Modules.selectors.auth.userAuthenticated(state),
  currentActiveIds: Modules.selectors.challenges.getCurrentActiveIds(state),
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
