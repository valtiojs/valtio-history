const isProduction =
  import.meta?.env?.MODE === 'production' ||
  process?.env?.['NODE_ENV'] === 'production';

export const warn = (...args: unknown[]) => {
  if (!isProduction) {
    console.warn(...args);
  }
};
