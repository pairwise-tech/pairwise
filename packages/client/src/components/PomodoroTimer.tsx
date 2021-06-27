import React from "react";
import { Position, Button } from "@blueprintjs/core";
import { Tooltip2, Popover2 } from "@blueprintjs/popover2";
import { IconButton, ExternalLink } from "./SharedComponents";
import styled from "styled-components";
import { COLORS } from "tools/constants";
import toaster from "../tools/toast-utils";
import { ANALYTICS_EVENTS } from "../modules/app/epics";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IProps {}

type PomodoroStage = "study" | "break";

interface IState {
  time: number;
  running: boolean;
  sessionCount: number;
  stage: PomodoroStage;
}

const STUDY_TIME = 25 * 60 * 1000; // 25 minutes
const BREAK_TIME = 5 * 60 * 1000; // 5 minutes

/** ===========================================================================
 * Pomodoro Timer Popover
 * ============================================================================
 */

export class PomodoroTimer extends React.Component<IProps, IState> {
  interval: any = null;

  constructor(props: IProps) {
    super(props);

    this.state = {
      time: 0,
      running: false,
      stage: "study",
      sessionCount: 0,
    };
  }

  componentWillUnmount() {
    this.cancelTimer();
  }

  render() {
    const { stage, running, sessionCount } = this.state;
    return (
      <Popover2
        usePortal={false}
        position={Position.BOTTOM}
        content={
          <PopoverContainer>
            <Title>
              Pomodoro Challenge
              {sessionCount > 0 ? ` Session: ${sessionCount}` : ""}
            </Title>
            <Description>
              <Text>
                The{" "}
                <ExternalLink link="https://en.wikipedia.org/wiki/Pomodoro_Technique">
                  Pomodoro Technique
                </ExternalLink>{" "}
                is a timed study method.
              </Text>
              <Text>
                The technique alternates between study and break sessions. A
                study session typically lasts 25 minutes and is followed by a 5
                minute break. After 4 pomodoro sessions, a longer break is
                taken.
              </Text>
            </Description>
            {running ? (
              <Button
                large
                intent="danger"
                style={{ marginTop: 8 }}
                className="bp3-popover-dismiss"
                onClick={this.handleStopSession}
              >
                Cancel Session
              </Button>
            ) : (
              <Button
                large
                intent="success"
                style={{ marginTop: 8 }}
                className="bp3-popover-dismiss"
                onClick={this.handleStartSession}
              >
                Start the Clock!
              </Button>
            )}
          </PopoverContainer>
        }
      >
        <Tooltip2
          usePortal={false}
          content={running ? "View Pomodoro Status" : "Pomodoro Challenge"}
          position="bottom"
        >
          {running ? (
            <Button>
              <Time stage={stage}>
                {new Date(this.state.time).toISOString().substr(14, 5)}
              </Time>
            </Button>
          ) : (
            <IconButton icon="time" aria-label="View Pomodoro Challenge" />
          )}
        </Tooltip2>
      </Popover2>
    );
  }

  cancelTimer = () => {
    if (this.interval) {
      clearInterval(this.interval);
    }
  };

  startTimer = () => {
    this.setState(
      {
        stage: "study",
        time: STUDY_TIME,
      },
      () => {
        const { sessionCount } = this.state;
        this.interval = setInterval(this.updateTime, 1000);
        toaster.success(
          `Pomodoro Session ${sessionCount} started! The clock starts now.`,
        );
      },
    );
  };

  updateTime = () => {
    this.setState(
      {
        time: this.state.time - 1000,
      },
      () => {
        const { time, stage, sessionCount } = this.state;
        if (time === 0) {
          if (stage === "study") {
            this.setState(
              {
                stage: "break",
                time: BREAK_TIME,
              },
              () => {
                toaster.success(
                  `Study session ${sessionCount} complete! Take a break now.`,
                );
              },
            );
          } else {
            // Cancel the currently running timer first before restarting
            this.cancelTimer();
            this.setState({ sessionCount: sessionCount + 1 }, this.startTimer);
          }
        }
      },
    );
  };

  handleStartSession = () => {
    this.setState(
      { running: true, stage: "study", sessionCount: 1 },
      this.startTimer,
    );
  };

  handleStopSession = () => {
    this.cancelTimer();
    this.setState(
      {
        time: 0,
        running: false,
        stage: "study",
        sessionCount: 0,
      },
      () => {
        toaster.warn("Pomodoro session stopped.");
      },
    );
  };

  logAnalyticsEvent = () => {
    try {
      const amp = window?.amplitude?.getInstance();
      if (amp) {
        amp.logEvent(ANALYTICS_EVENTS.START_POMODORO_SESSION);
      }
    } catch (err) {
      // Nothing...
    }
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const PopoverContainer = styled.div`
  width: 450px;
  padding: 18px;
  padding-left: 12px;
  padding-right: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Description = styled.div``;

const Title = styled.h3`
  margin: 0;
  padding-bottom: 4px;
  margin-bottom: 4px;
  border-bottom: 1px solid ${COLORS.TEXT_CONTENT};
`;

const Text = styled.p`
  margin: 8px;
`;

const Time = styled.code`
  color: ${(props: { stage: PomodoroStage }) =>
    props.stage === "study" ? COLORS.SECONDARY_YELLOW : COLORS.NEON_GREEN};
`;

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default PomodoroTimer;
