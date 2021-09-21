import React from "react";
import useInterval from "@use-it/interval";
import styled from "styled-components/macro";
import { COLORS } from "../tools/constants";

/** ===========================================================================
 * Component
 * ----------------------------------------------------------------------------
 * - Displays update time since last refresh occurred text bar.
 * ============================================================================
 */

const TimeSinceRefresh = (props: { lastUpdated: number }) => {
  const getTimeElapsed = () => timeSince(new Date(props.lastUpdated));
  const [elapsed, setElapsed] = React.useState(getTimeElapsed());

  // Update time elapsed calculation every second
  useInterval(() => {
    setElapsed(getTimeElapsed());
  }, 1000);

  // Reset on props update
  React.useEffect(() => {
    setElapsed(getTimeElapsed());
  }, [props.lastUpdated]);

  return (
    <TimeElapsedRow>
      <TimeSinceText>Last updated: {elapsed}</TimeSinceText>
    </TimeElapsedRow>
  );
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const TimeSinceText = styled.p`
  margin: 0;
  font-size: 10px;
  color: ${COLORS.GRAY_TEXT};
`;

const TimeElapsedRow = styled.div`
  display: flex;
  margin-top: -16px;
  max-width: 425px;
  justify-content: flex-end;
`;

/** ===========================================================================
 * Utils
 * ============================================================================
 */

const intervals = [
  { label: "year", seconds: 31536000 },
  { label: "month", seconds: 2592000 },
  { label: "day", seconds: 86400 },
  { label: "hour", seconds: 3600 },
  { label: "minute", seconds: 60 },
  { label: "second", seconds: 1 },
];

/**
 * Courtesy of StackOverflow.
 *
 * https://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
 */
const timeSince = (date: Date) => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const interval = intervals.find((i) => i.seconds < seconds);

  if (interval) {
    const count = Math.floor(seconds / interval.seconds);
    return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
  }

  return "Just now";
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default TimeSinceRefresh;
