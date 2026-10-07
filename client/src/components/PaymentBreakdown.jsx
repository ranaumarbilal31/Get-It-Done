import React from 'react';
export const money = (cents) => '$' + (Number(cents || 0) / 100).toFixed(2);
export function quote(amount) {
  const price = Math.round(Number(amount || 0) * 100),
    rate = price < 5000 ? 2 : price < 10000 ? 4 : 5;
  const workerFee = Math.min(100, price) + Math.round((Math.max(0, price - 100) * rate) / 100);
  return {
    amountCents: price,
    posterTotalCents: price + 100,
    taskerNetCents: price - workerFee,
    feeRate: rate,
    platformFeeCents: workerFee + 100,
  };
}
export default function PaymentBreakdown({ payment, worker = false }) {
  const legacy = payment.feeVersion === 'legacy',
    refunded = payment.status === 'REFUNDED';
  const connection =
    refunded || legacy
      ? 0
      : worker
        ? Math.min(100, Math.max(0, payment.platformFeeCents - 100))
        : 100;
  const serviceFee = refunded
    ? 0
    : legacy
      ? payment.platformFeeCents
      : Math.max(0, payment.platformFeeCents - 100 - connection);
  return (
    <dl className="payment-breakdown">
      <div>
        <dt>Agreed task price</dt>
        <dd>{money(payment.amountCents)}</dd>
      </div>
      <div>
        <dt>Connection fee</dt>
        <dd>{money(connection)}</dd>
      </div>
      {worker && (
        <div>
          <dt>
            Service fee ({payment.feeRate}%{legacy ? '' : ' after connection fee'})
          </dt>
          <dd>{money(serviceFee)}</dd>
        </div>
      )}
      <div className="payment-total">
        <dt>
          {refunded
            ? worker
              ? 'Credited to you'
              : 'Refunded to you'
            : worker
              ? 'You receive'
              : 'Your funded total'}
        </dt>
        <dd>{money(worker ? payment.taskerNetCents : payment.posterTotalCents)}</dd>
      </div>
    </dl>
  );
}
