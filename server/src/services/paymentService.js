const crypto = require('node:crypto');
const { fail } = require('./fees');
// Provider boundary: the preview provider records workflow only and never charges a card.
const preview = {
  async authorize({ confirmPreview, amountCents }) {
    if (confirmPreview !== true || !Number.isInteger(amountCents) || amountCents < 200)
      throw fail(400, 'Confirm the payment preview. No actual charge occurs.');
    return { provider: 'preview', reference: crypto.randomUUID() };
  },
};
module.exports = { provider: preview };
