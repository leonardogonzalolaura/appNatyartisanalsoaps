export const DEFAULT_CURRENCY = { code: 'COP', symbol: '$' };

export function currencyFromConfig(config) {
  return {
    code: config?.currency_code || DEFAULT_CURRENCY.code,
    symbol: config?.currency_symbol || DEFAULT_CURRENCY.symbol
  };
}

// COP: sin decimales. Otros: 2 decimales.
export function formatPrice(value, config) {
  const { code, symbol } = currencyFromConfig(config);
  const n = Number(value || 0);
  if (code === 'COP') return `${symbol} ${Math.round(n).toLocaleString('es-CO')}`;
  return `${symbol} ${n.toFixed(2)}`;
}
