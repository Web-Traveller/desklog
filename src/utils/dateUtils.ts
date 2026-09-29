// Date utility helpers for DeskLog calendar matching and formatting

export function getFormattedToday(): string {
  const now = new Date();
  const day = now.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

export function getFormattedNow(): string {
  const todayStr = getFormattedToday();
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${todayStr}, ${timeStr}`;
}

export function parseDateString(dateStr?: string): { day: number; month: string; year: number } | null {
  if (!dateStr) return null;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Match patterns like "27 Sep 2026" or "27 Sep 2026, 01:45 PM"
  const match = dateStr.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (match) {
    return {
      day: parseInt(match[1], 10),
      month: match[2],
      year: parseInt(match[3], 10),
    };
  }

  // Match ISO pattern like "2026-09-27" or "2026-09-27T14:30"
  const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const monthIdx = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    if (monthIdx >= 0 && monthIdx < 12) {
      return {
        day,
        month: months[monthIdx],
        year,
      };
    }
  }

  return null;
}

export function dateMatchesCalendarDate(dateStr?: string, calendarDateStr?: string): boolean {
  if (!dateStr || !calendarDateStr) return false;

  // Handle 'Today'
  if (calendarDateStr === 'Today') {
    const today = getFormattedToday();
    return dateMatchesCalendarDate(dateStr, today);
  }

  const parsed1 = parseDateString(dateStr);
  const parsed2 = parseDateString(calendarDateStr);

  if (parsed1 && parsed2) {
    return (
      parsed1.day === parsed2.day &&
      parsed1.month.toLowerCase() === parsed2.month.toLowerCase() &&
      parsed1.year === parsed2.year
    );
  }

  // Fallback string includes check
  return dateStr.toLowerCase().includes(calendarDateStr.toLowerCase());
}
