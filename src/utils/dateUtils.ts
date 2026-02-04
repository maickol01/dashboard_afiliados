export const isSameDay = (d1: Date, d2: Date) => 
  d1.getDate() === d2.getDate() && 
  d1.getMonth() === d2.getMonth() && 
  d1.getFullYear() === d2.getFullYear();

export const isSameWeek = (date: Date, now: Date) => {
  const d = new Date(date);
  const n = new Date(now);
  d.setHours(0, 0, 0, 0);
  n.setHours(0, 0, 0, 0);
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  n.setDate(n.getDate() + 4 - (n.getDay() || 7));
  // Get first day of year
  const yearStartD = new Date(d.getFullYear(), 0, 1);
  const yearStartN = new Date(n.getFullYear(), 0, 1);
  // Calculate full weeks to nearest Thursday
  const weekNoD = Math.ceil((((d.getTime() - yearStartD.getTime()) / 86400000) + 1) / 7);
  const weekNoN = Math.ceil((((n.getTime() - yearStartN.getTime()) / 86400000) + 1) / 7);
  return weekNoD === weekNoN && d.getFullYear() === n.getFullYear();
};

export const isSameMonth = (d1: Date, d2: Date) => 
  d1.getMonth() === d2.getMonth() && 
  d1.getFullYear() === d2.getFullYear();

export const checkDateFilter = (dateStr: Date | string, selectedOption: string, customDate: Date | null) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (selectedOption === 'total') return true;
    if (selectedOption === 'day') return isSameDay(date, now);
    if (selectedOption === 'week') return isSameWeek(date, now);
    if (selectedOption === 'month') return isSameMonth(date, now);
    if (selectedOption === 'custom' && customDate) return isSameDay(date, customDate);
    return true;
};
