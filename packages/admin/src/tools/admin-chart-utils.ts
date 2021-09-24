import { RecentProgressAdminDto } from "@pairwise/common";
import { ChartDataSeries } from "../components/AdminChartComponent";

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

  const data = [];
  for (const [key, value] of Object.entries(recordsMap)) {
    data.push({
      yValue: value,
      xValue: Number(key),
      name: "Completed Challenges",
    });
  }

  const sortedData = data.sort((a, b) => {
    return b.yValue - b.yValue;
  });

  return sortedData;
};
