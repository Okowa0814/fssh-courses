/*
- Maps Mon-Fri to days array index 0-4; 
- Sat/Sun have no schedule column, so return -1 (don't highlight "today"). 
*/
export function todayDayIndex(days: string[], now: Date = new Date()): number {
    const jsDay = now.getDay();

    // Neither Saturday nor Sunday has a schedule column, so skip highlighting
    if (jsDay === 0 || jsDay === 6) return -1;

    // Monday maps to index 0, so shift back by 1
    const index = jsDay - 1;

    return index < days.length ? index : -1;
}
