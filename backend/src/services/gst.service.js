export const GST_RATES = [0, 5, 12, 18, 28];

export const computeGST = (taxableValue, gstRate, fromState, toState) => {
  const totalTax = Math.round((taxableValue * gstRate) / 100);
  const half = Math.round(totalTax / 2);

  if (fromState && toState && fromState !== toState) {
    return { cgst: 0, sgst: 0, igst: totalTax, totalTax };
  }

  return { cgst: half, sgst: totalTax - half, igst: 0, totalTax };
};

export const buildHsnSummary = (items) => {
  const map = {};
  for (const item of items) {
    const hsnCode = item.productSnapshot?.hsnCode || '0000';
    const gstRate = item.gstRate || 0;
    const key = `${hsnCode}-${gstRate}`;
    if (!map[key]) {
      map[key] = { hsnCode, gstRate, taxableValue: 0, cgst: 0, sgst: 0, igst: 0 };
    }
    map[key].taxableValue += item.total;
  }
  return Object.values(map);
};
