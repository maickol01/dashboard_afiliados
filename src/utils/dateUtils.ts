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

export const checkDateFilter = (dateStr: Date | string, selectedOption: string, customRange: { startDate: Date | null, endDate: Date | null }) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (selectedOption === 'total') return true;
    if (selectedOption === 'day') return isSameDay(date, now);
    if (selectedOption === 'week') return isSameWeek(date, now);
    if (selectedOption === 'month') return isSameMonth(date, now);
    if (selectedOption === 'custom') {
        const { startDate, endDate } = customRange;
        if (startDate && endDate) {
            // Set times to 0 for comparison if we only care about days
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            return d >= start && d <= end;
        }
        if (startDate) return isSameDay(date, startDate);
        return true;
    }
    return true;
};

export const getFilterDateRange = (selectedOption: string, customRange: { startDate: Date | null, endDate: Date | null }) => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = new Date(); 

    if (selectedOption === 'total') return { start: undefined, end: undefined };
    
    if (selectedOption === 'day') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    } else if (selectedOption === 'week') {
        startDate = new Date(now);
        // Empezamos lunes
        const day = now.getDay() || 7;
        startDate.setDate(now.getDate() - day + 1);
        startDate.setHours(0, 0, 0, 0);
    } else if (selectedOption === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
    } else if (selectedOption === 'custom') {
        startDate = customRange.startDate;
        endDate = customRange.endDate || new Date();
        if (endDate) endDate.setHours(23, 59, 59, 999);
    }

    return { 
        start: startDate?.toISOString(), 
        end: endDate?.toISOString() 
    };
};
