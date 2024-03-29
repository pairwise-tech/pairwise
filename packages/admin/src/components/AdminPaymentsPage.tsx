import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import {
  PageContainer,
  DataCard,
  KeyValue,
  SummaryText,
} from "./AdminComponents";
import { estimateTotalPaymentsRevenue } from "../tools/admin-utils";

/** ===========================================================================
 * AdminPaymentsPage Component
 * ============================================================================
 */

class AdminPaymentsPage extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const { paymentRecords } = this.props;
    const { totalRevenue, totalNumberOfPayments } =
      estimateTotalPaymentsRevenue(paymentRecords);
    return (
      <PageContainer>
        <Title>Course Payments</Title>
        {totalNumberOfPayments > 0 ? (
          <SummaryText>
            There are currently {totalNumberOfPayments} total user payments, for
            a total of ${totalRevenue.toFixed(2)} in course revenue.
          </SummaryText>
        ) : (
          <SummaryText>
            There are currently {paymentRecords.length} total payments.
          </SummaryText>
        )}

        {paymentRecords.map((payment) => {
          return (
            <DataCard key={payment.uuid}>
              <KeyValue label="status" value={payment.status} />
              <KeyValue label="paymentType" value={payment.paymentType} />
              <KeyValue label="courseId" value={payment.courseId} code />
              <KeyValue
                label="amountPaid"
                value={`$${(payment.amountPaid / 100).toFixed(2)}`}
              />
              <KeyValue
                label="datePaid"
                value={new Date(payment.datePaid).toDateString()}
              />
              <KeyValue label="uuid (payment)" value={payment.uuid} />
              <KeyValue label="extraData" value={payment.extraData} />
              <KeyValue
                label="createdAt"
                value={new Date(payment.createdAt).toDateString()}
              />
              <KeyValue
                label="updatedAt"
                value={new Date(payment.updatedAt).toDateString()}
              />
            </DataCard>
          );
        })}
      </PageContainer>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const Title = styled.h2``;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  paymentRecords: Modules.selectors.payments.paymentRecordsSelector(state),
});

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(AdminPaymentsPage);
