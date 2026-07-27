/** 週一～週六對應 days 陣列索引 0-5；週日沒有對應節次，回傳 -1（不標記「今天」）。 */
export function todayDayIndex(days: string[], now: Date = new Date()): number {
    const jsDay = now.getDay(); // 0=Sun,1=Mon,...,6=Sat
    if (jsDay === 0) return -1;
    const index = jsDay - 1;
    return index < days.length ? index : -1;
}
