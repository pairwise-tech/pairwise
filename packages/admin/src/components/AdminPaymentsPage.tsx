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
import { PaymentRecord } from "../modules/payments/store";

/** ===========================================================================
 * AdminPaymentsPage Component
 * ============================================================================
 */

class AdminPaymentsPage extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const { paymentRecords } = this.props;
    const totalUserPayments = estimateTotalRevenue(paymentRecords);
    const COURSE_PRICE = 50;
    const totalRevenue = totalUserPayments * COURSE_PRICE;
    return (
      <PageContainer>
        <Title>Course Payments</Title>
        {totalUserPayments > 0 ? (
          <SummaryText>
            There are currently {totalUserPayments} total user payments, for a
            total of ${totalRevenue.toFixed(2)} in course revenue.
          </SummaryText>
        ) : (
          <SummaryText>
            There are currently {paymentRecords.length} total payments.
          </SummaryText>
        )}

        {paymentRecords.reverse().map(payment => {
          return (
            <DataCard key={payment.uuid}>
              <KeyValue label="status" value={payment.status} />
              <KeyValue label="paymentType" value={payment.paymentType} />
              <KeyValue label="courseId" value={payment.courseId} code />
              <KeyValue label="amountPaid" value={payment.amountPaid} />
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

/**
 * Helper to estimate the total collected course revenue.
 */
const estimateTotalRevenue = (payments: PaymentRecord[]) => {
  let total = 0;

  for (const x of payments) {
    if (x.paymentType === "USER_PAID") {
      total++;
    }
  }

  // Decrement the total by 1
  // (the first real course payment was made as a test)
  total--;

  return total;
};

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
