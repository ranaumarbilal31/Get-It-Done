const fail = (status, message) => Object.assign(new Error(message), { status });
function cents(value) {
  const number = Number(value);
  if (
    !Number.isFinite(number) ||
    number < 2 ||
    number > 50000 ||
    Math.abs(number * 100 - Math.round(number * 100)) > 0.000001
  )
    throw fail(
      400,
      'The agreed price must be between $2 and $50,000, with at most two decimal places.',
    );
  return Math.round(number * 100);
}
function breakdown(amountCents, rateOverride) {
  const feeRate = rateOverride ?? (amountCents < 5000 ? 2 : amountCents < 10000 ? 4 : 5);
  const taskerConnection = Math.min(100, amountCents);
  const percentage = Math.round(((amountCents - taskerConnection) * feeRate) / 100);
  return {
    amountCents,
    posterTotalCents: amountCents + 100,
    taskerNetCents: amountCents - taskerConnection - percentage,
    platformFeeCents: 100 + taskerConnection + percentage,
    feeRate,
    feeVersion: 'v1',
  };
}
module.exports = { cents, breakdown, fail };
