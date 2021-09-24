import {
  AdminProgressChartDto,
  RecentProgressAdminDto,
} from "@pairwise/common";
import { ChartDataSeries } from "../components/AdminChartComponent";
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
export const getUsersChartData = (users: AdminUserView[]): ChartDataSeries => {
  const usersCreatedMap = users.reduce((map, user) => {
    const key = new Date(user.createdAt).toDateString();
    const existing = key in map ? map[key] : 0;
    return {
      ...map,
      [key]: existing + 1,
    };
  }, {} as { [key: string]: number });

  const data: ChartDataSeries = [];
  for (const [key, value] of Object.entries(usersCreatedMap)) {
    data.push({
      xValue: key,
      yValue: value,
      name: "Registered Users",
    });
  }

  let firstDate = new Date(users[0].createdAt);
  let today = new Date();
  let normalizedResultsData: ChartDataSeries = [];
  let current = firstDate;

  let runningTotal = 0;

  while (firstDate <= today) {
    const key = new Date(current).toDateString();
    if (key in usersCreatedMap) {
      const value = usersCreatedMap[key];
      runningTotal += value;
    }

    normalizedResultsData.push({
      yValue: runningTotal,
      xValue: key,
      name: "Registered Users",
    });

    // Advance day by 1
    current.setDate(current.getDate() + 1);
  }

  return normalizedResultsData;
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
