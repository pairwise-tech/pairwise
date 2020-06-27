import React from "react";
import { Popover, Position, Tooltip, Button, Classes } from "@blueprintjs/core";
import { IconButton } from "./Shared";
import styled from "styled-components/macro";
import formatDistance from "date-fns/formatDistance";
import format from "date-fns/format";
import { connect } from "react-redux";
import Modules from "modules/root";
import { FEEDBACK_DIALOG_TYPES } from "modules/feedback/actions";

const Upper = styled.div`
  display: block;
  background: #212121;
  padding: 20px;
`;

const Lower = styled.div`
  display: block;
  background: #373737;
  padding: 20px;
`;

const Container = styled.div`
  max-width: 400px;

  p {
    margin: 20px 0;
  }
`;

const LIVE_ICON_STYLES = `
  width: 16px;
  height: 16px;
  border-radius: 50px;
`;

const IN_SESSION_STYLES = `
  ${LIVE_ICON_STYLES}
  box-shadow: 0px 0px 7px #61ff00;
  background: #a7ff72;
  border: 1px solid #408a12;
`;

const UPCOMING_SESSION_STYLES = `
  ${LIVE_ICON_STYLES}
  box-shadow: 0px 0px 7px #61ff00;
  background: #a7ff72;
  border: 1px solid #408a12;
`;

const InSessionIcon = styled.div`
  ${IN_SESSION_STYLES}
`;

const UpcomingSessionIcon = styled.div`
  ${UPCOMING_SESSION_STYLES}
`;

const OutOfSessionIcon = styled.div`
  ${LIVE_ICON_STYLES}
  background: #c4c4c4;
  border: 1px solid #585858;
`;

interface Session {
  startDate: string;
  endDate?: string;
  url: string;
}

// Just assume sessions last 60 minutes
const SIXTY_MINUTES = 60 * 60 * 1000;

const SESSIONS: Session[] = [
  /* Use for testing the UI for active and non-active */
  // Current session
  // {
  //   startDate: new Date().toISOString(),
  // },

  // Next session
  {
    startDate: "2020-06-27T07:30:00.000Z",
  },
].map(x => ({
  ...x,
  // Our real livestream URL, supposedly. Since it doesn't change I'm just
  // applying it to all sessions for now
  url: "https://www.youtube.com/channel/UCG52QHurjYWfqFBQR_60EUQ/live",
}));

const inSession = (session: Session) => {
  const startTime = new Date(session.startDate).getTime();
  const endTime = startTime + SIXTY_MINUTES;
  const now = Date.now();

  return startTime < now && now < endTime;
};

const isUpcoming = (session: Session) => {
  const startTime = new Date(session.startDate).getTime();
  const preStartTime = startTime - SIXTY_MINUTES;
  const now = Date.now();

  return preStartTime < now && now < startTime;
};

const getSessionStatus = (
  session: Session,
): "UPCOMING" | "IN_PROGRESS" | "PASSED" => {
  return isUpcoming(session)
    ? "UPCOMING"
    : inSession(session)
    ? "IN_PROGRESS"
    : "PASSED";
};

const isSessionPassed = (session: Session) => {
  return new Date(session.startDate).getTime() < new Date().getTime();
};

const getRelativeTimeDistance = ({ startDate }: Session) => {
  const start = new Date(startDate);
  const end = Date.now();
  return formatDistance(start, end, { addSuffix: true });
};

const CurrentSession = styled(({ session, ...props }) => {
  const start = new Date(session.startDate);

  return (
    <div {...props}>
      <h4>{format(start, "MMMM d 'at' p")}</h4>
      <p style={{ marginTop: -10, marginBottom: 0 }}>
        <em>{getRelativeTimeDistance(session)}</em>
      </p>
    </div>
  );
})<{
  session: Session;
}>`
  display: block;
`;

type Props = typeof dispatchProps;

const OfficeHoursPopover = (props: Props) => {
  const upcomingSession = SESSIONS.find(isUpcoming);
  const currentSession = SESSIONS.find(inSession);

  // TODO: Should filter to only find the _latest_ regardless of array order
  const nextSession = SESSIONS.find(x => !inSession(x) && !isSessionPassed(x));

  const handleRequest = React.useCallback(() => {
    props.setFeedbackDialogState(FEEDBACK_DIALOG_TYPES.PAIRWISE_LIVE_REQUEST);
    // eslint-disable-next-line
  }, [props.setFeedbackDialogState, props.setFeedbackType]);

  return (
    <Popover
      usePortal={false}
      position={Position.BOTTOM}
      content={
        <Container>
          <Upper>
            <SectionTitle
              icon={
                currentSession ? (
                  <InSessionIcon />
                ) : upcomingSession ? (
                  <UpcomingSessionIcon />
                ) : (
                  <OutOfSessionIcon />
                )
              }
            >
              Pairwise Live
            </SectionTitle>
            <p>
              {currentSession
                ? "We’re online! Join us. Ask questions and get help learning to code."
                : upcomingSession
                ? `There's a session starting ${getRelativeTimeDistance(
                    upcomingSession,
                  )}`
                : "Currently Offline. See below for our next session. You can also request a session."}
            </p>
            {currentSession && (
              <a
                href={currentSession.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button fill large intent={"success"}>
                  Join Session
                </Button>
              </a>
            )}
          </Upper>
          <Lower>
            {nextSession ? (
              <>
                <SectionTitle icon="📆">Next Scheduled Session</SectionTitle>
                <CurrentSession session={nextSession} />
              </>
            ) : (
              <>
                <SectionTitle>
                  No future sessions currently scheduled.
                </SectionTitle>
              </>
            )}
          </Lower>
          <div style={{ padding: 20, background: "#212121" }}>
            <Button
              className={Classes.POPOVER_DISMISS}
              onClick={handleRequest}
              fill
              large
            >
              Request Another Session
            </Button>
          </div>
        </Container>
      }
    >
      <Tooltip
        usePortal={false}
        content={
          currentSession
            ? "Join the Live Session"
            : upcomingSession
            ? "Session Starting Soon"
            : "View Scheduled Sessions"
        }
        position="bottom"
      >
        {currentSession ? (
          <LiveIndicator>
            <IconButton icon="record" aria-label="View Scheduled Sessions" />
          </LiveIndicator>
        ) : upcomingSession ? (
          <UpcomingIndicator>
            <IconButton icon="record" aria-label="View Scheduled Sessions" />
          </UpcomingIndicator>
        ) : (
          <IconButton icon="record" aria-label="View Scheduled Sessions" />
        )}
      </Tooltip>
    </Popover>
  );
};

const LiveIndicator = styled.div`
  position: relative;
  &:before {
    ${IN_SESSION_STYLES}
    content: "";
    cursor: pointer;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.8);
  }
`;

const UpcomingIndicator = styled.div`
  position: relative;
  &:before {
    ${UPCOMING_SESSION_STYLES}
    content: "";
    cursor: pointer;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.8);
  }
`;

const SectionTitle = styled(({ icon, children, ...props }) => {
  return (
    <h3 {...props}>
      {icon && <span style={{ marginRight: 20 }}>{icon}</span>}
      {children}
    </h3>
  );
})<{ icon?: React.ReactNode; children: React.ReactNode }>`
  margin: 0;
  margin-bottom: 20px;
  display: flex;
  align-items: center;

  &:last-child {
    margin-bottom: 0;
  }
`;

const dispatchProps = {
  setFeedbackType: Modules.actions.feedback.setFeedbackType,
  setFeedbackDialogState: Modules.actions.feedback.setFeedbackDialogState,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default connect(null, dispatchProps)(OfficeHoursPopover);
