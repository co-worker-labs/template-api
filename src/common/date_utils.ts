export function todayNumber() {
  return formatNumber(new Date());
}

export function yesterdayNumber() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return formatNumber(yesterday);
}

export function formatNumber(date: Date) {
  return Number(`${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`);
}
