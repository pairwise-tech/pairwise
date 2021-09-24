import {
  AdminProgressChartDto,
  RecentProgressAdminDto,
} from "@pairwise/common";
import {
  ChartDataSeries,
  UsersChartDataSeries,
} from "../components/AdminChartComponent";
import { AdminUserView } from "../modules/users/store";

/**
 * Map progress records to chart data.
 */
export const getRecentProgressRecordsChartData = (
  progressRecords: RecentProgressAdminDto,
): ChartDataSeries => {
  let max: number = -1;
  const recordsMap = progressRecords.records.reduce((map, entry) => {
    const key = String(entry.challenges.length);
    const existing = key in map ? map[key] : 0;
    const value = existing + 1;
    max = Math.max(max, entry.challenges.length);
    return {
      ...map,
      [key]: value,
    };
  }, {} as { [key: string]: number });

  let current = 0;
  const normalizedResultsData: ChartDataSeries = [];

  // Normalize data set to fill in all x-axis values
  while (current <= max) {
    const key = String(current);
    const challengeCount = current;
    if (key in recordsMap) {
      const totalUsersCount = recordsMap[key];

      normalizedResultsData.push({
        yValue: totalUsersCount,
        xValue: challengeCount,
        name: "Completed Challenges",
      });
    } else {
      normalizedResultsData.push({
        yValue: 0,
        xValue: challengeCount,
        name: "Completed Challenges",
      });
    }

    current = current + 1;
  }

  return normalizedResultsData;
};

/**
 * Map users list to chart data.
 */
export const getUsersChartData = (
  users: AdminUserView[],
  courseId: string,
): UsersChartDataSeries => {
  // Map user counts by date
  const reduceUsersMap = (
    map: { [key: string]: number },
    user: AdminUserView,
  ) => {
    const key = new Date(user.createdAt).toDateString();
    const existing = key in map ? map[key] : 0;
    return {
      ...map,
      [key]: existing + 1,
    };
  };

  // Filter users list by completed challenge thresholds
  const filterByChallengeCount = (count: number) => (user: AdminUserView) => {
    const progress = user.challengeProgressHistory.find(
      (history) => history.courseId === courseId,
    );

    if (!progress) {
      return false;
    } else {
      return Object.keys(progress.progress).length > 0;
    }
  };

  // Default users map
  const usersCreatedMap = users.reduce(reduceUsersMap, {});

  // Users with more than zero challenges
  const nonZeroUsersMap = users
    .filter(filterByChallengeCount(0))
    .reduce(reduceUsersMap, {});

  // Users with more than 5 challenges
  const moreThanFiveUsersMap = users
    .filter(filterByChallengeCount(5))
    .reduce(reduceUsersMap, {});

  let firstDate = new Date(users[0].createdAt);
  let current = firstDate;
  let today = new Date();
  let normalizedChartData: UsersChartDataSeries = [];

  let runningTotal = 0;
  let nonZeroRunningTotal = 0;
  let moreThanFiveUsersTotal = 0;

  // Build up chart data array of running total values
  while (firstDate <= today) {
    const key = new Date(current).toDateString();

    if (key in usersCreatedMap) {
      const value = usersCreatedMap[key];
      runningTotal += value;
    }

    if (key in nonZeroUsersMap) {
      const value = nonZeroUsersMap[key];
      nonZeroRunningTotal += value;
    }

    if (key in moreThanFiveUsersMap) {
      const value = moreThanFiveUsersMap[key];
      moreThanFiveUsersTotal += value;
    }

    normalizedChartData.push({
      xValue: key,
      yValue: runningTotal,
      nonZeroRunningTotal,
      moreThanFiveUsersTotal,
      name: "User Growth",
    });

    // Advance day by 1
    current.setDate(current.getDate() + 1);
  }

  return normalizedChartData;
};

/**
 * Map all users progress list to chart data.
 */
export const getUsersProgressChartData = (
  progress: AdminProgressChartDto,
): ChartDataSeries => {
  const chartData = progress.map((x) => {
    return {
      yValue: x.userCount,
      xValue: x.progressCount,
      name: "Users Progress Distribution",
    };
  });

  const sortedData = chartData.sort((a, b) => {
    return a.xValue - b.xValue;
  });

  return sortedData;
};
