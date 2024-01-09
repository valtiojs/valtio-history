const isProduction = import.meta?.env?.MODE === 'production';

export const warn = (...args: unknown[]) => {
  if (!isProduction) {
    console.warn(...args);
  }
};
