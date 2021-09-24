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
  const recordsMap = progressRecords.records.reduce((map, entry) => {
    const key = String(entry.challenges.length);
    const existing = key in map ? map[key] : 0;
    return {
      ...map,
      [key]: existing + 1,
    };
  }, {} as { [key: string]: number });

  const data: ChartDataSeries = [];
  for (const [key, value] of Object.entries(recordsMap)) {
    data.push({
      xValue: value,
      yValue: Number(key),
      name: "Completed Challenges",
    });
  }

  const sortedData = data.sort((a, b) => {
    return a.yValue - b.yValue;
  });

  return sortedData;
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

  const sortedData = data.sort((a, b) => {
    return a.yValue - b.yValue;
  });

  return sortedData;
};

/**
 * Map all users progress list to chart data.
 */
export const getUsersProgressChartData = (
  progress: AdminProgressChartDto,
): ChartDataSeries => {
  return progress.map((x) => {
    return {
      xValue: x.userCount,
      yValue: x.progressCount,
      name: "Users Progress Distribution",
    };
  });
};
