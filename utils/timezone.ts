
export const getLocalTimezoneOffset = (): number => {
  return -new Date().getTimezoneOffset();
};

export const getLocalTimezoneOffsetMs = (): number => {
  return getLocalTimezoneOffset() * 60 * 1000;
};


export const getLocalISOString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

export const getLocalDayRange = (timestampUtcMs: number = Date.now()) => {
  const date = new Date(timestampUtcMs);
  
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  const startLocal = new Date(year, month, day, 0, 0, 0, 0);
  const endLocal = new Date(year, month, day + 1, 0, 0, 0, 0);
  
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  
  return { 
    startUtcMs: startLocal.getTime(), 
    endUtcMs: endLocal.getTime(), 
    dateStr 
  };
};


export const getTodayLocal = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};

export const getLocalDateStr = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

