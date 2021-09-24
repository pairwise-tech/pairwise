import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import {
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AppTheme } from "../../../common/dist/main";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

// Yeah, https://recharts.org/en-US/examples/CustomContentOfTooltip
type wtfType = any;

/** ===========================================================================
 * Charts Component
 * ============================================================================
 */

class AdminChartComponent extends React.Component<IProps> {
  render() {
    const { xName, yName, data, appTheme, chartWidth, chartHeight } =
      this.props;
    return (
      <SizedChartContainer chartWidth={chartWidth} chartHeight={chartHeight}>
        <ResponsiveContainer width="100%" height="100%" minWidth="0">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#27C9DD" stopOpacity={1} />
                <stop offset="95%" stopColor="#27C9DD" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <XAxis
              name={xName}
              dataKey="xValue"
              stroke={getChartAxisColor(appTheme)}
            />
            <YAxis
              name={yName}
              dataKey="yValue"
              stroke={getChartAxisColor(appTheme)}
            />
            <CartesianGrid
              stroke={getChartGridColor(appTheme)}
              strokeDasharray="3 3"
            />
            <Tooltip content={this.formatTooltip} />
            <Area
              fillOpacity={1}
              type="monotone"
              dataKey="yValue"
              stroke="#27C9DD"
              fill="url(#colorUv)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </SizedChartContainer>
    );
  }

  formatTooltip = (props: wtfType) => {
    const { payload } = props;

    if (payload && Array.isArray(payload)) {
      const entry = payload[0];
      if (entry) {
        const item = entry.payload;

        if (item) {
          const { xValue, yValue, name } = item;
          const { xName, yName, xNameTooltipHide, yNameTooltipHide } =
            this.props;
          return (
            <TooltipContent>
              <TooltipText>{name}</TooltipText>
              <TooltipText>
                {xValue} {xNameTooltipHide ? "" : xName}
              </TooltipText>
              <TooltipText>
                {yValue} {yNameTooltipHide ? "" : yName}{" "}
              </TooltipText>
            </TooltipContent>
          );
        }
      }
    }

    return null;
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const SizedChartContainer = styled.div<ChartDimensions>`
  height: ${(props) => props.chartHeight}px;
  max-width: ${(props) => props.chartWidth}px;
`;

const TooltipContent = styled.div`
  padding: 6px;
  color: black;
  border-radius: 6px;
  background: rgba(225, 225, 225, 0.88);
`;

const TooltipText = styled.p`
  margin: 2px;
`;

const getChartAxisColor = (appTheme: AppTheme) => {
  return appTheme === "dark" ? "rgb(185,185,185)" : "rgb(10,10,10)";
};

const getChartGridColor = (appTheme: AppTheme) => {
  return appTheme === "dark" ? "rgb(65,65,65)" : "rgb(100,100,100)";
};

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  appTheme: Modules.selectors.admin.adminUserSettings(state).appTheme,
});

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface ChartDimensions {
  chartWidth: number;
  chartHeight: number;
}

interface ChartData {
  name: string;
  yValue: number;
  xValue: number | string;
}

export type ChartDataSeries = ChartData[];

interface ComponentProps extends ChartDimensions {
  xName: string;
  yName: string;
  xNameTooltipHide?: boolean;
  yNameTooltipHide?: boolean;
  data: ChartDataSeries;
}

type IProps = ConnectProps & ComponentProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(AdminChartComponent);
