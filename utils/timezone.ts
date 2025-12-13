export const getLocalTimezoneOffset = (): number => {
  return -new Date().getTimezoneOffset();
};

export const getLocalTimezoneOffsetMs = (): number => {
  return getLocalTimezoneOffset() * 60 * 1000;
};

export const getLocalDayRange = (timestampUtcMs: number = Date.now()) => {
  const localOffsetMs = getLocalTimezoneOffsetMs();
  const localMs = timestampUtcMs + localOffsetMs;
  const localDate = new Date(localMs);
  localDate.setHours(0, 0, 0, 0);
  const startUtcMs = localDate.getTime() - localOffsetMs;
  const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000;
  const dateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
  return { startUtcMs, endUtcMs, dateStr };
};

export const getTodayLocal = (): Date => {
  const now = new Date();
  const localOffsetMs = getLocalTimezoneOffsetMs();
  const localMs = now.getTime() + localOffsetMs;
  const localDate = new Date(localMs);
  localDate.setHours(0, 0, 0, 0);
  return new Date(localDate.getTime() - localOffsetMs);
};

