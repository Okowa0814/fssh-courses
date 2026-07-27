import type { GridCellClassView, GridCellTeacherView, Session } from '../types';

function createEmptyGrid<T>(dayCount: number, periodCount: number): (T | null)[][] {
    return Array.from({ length: dayCount }, () => Array<T | null>(periodCount).fill(null));
}

/** 依教師姓名篩選 sessions，組成 day x period 矩陣，每格顯示科目 + 教室。 */
export function buildTeacherGrid(
    sessions: Session[],
    teacher: string,
    dayCount: number,
    periodCount: number
): (GridCellTeacherView | null)[][] {
    const grid = createEmptyGrid<GridCellTeacherView>(dayCount, periodCount);
    for (const s of sessions) {
        if (s.teacher === teacher) grid[s.day][s.period] = { subject: s.subject, room: s.room };
    }
    return grid;
}

/** 依教室代碼（班級代稱）篩選 sessions，組成 day x period 矩陣，每格顯示科目 + 教師。 */
export function buildRoomGrid(
    sessions: Session[],
    room: string,
    dayCount: number,
    periodCount: number
): (GridCellClassView | null)[][] {
    const grid = createEmptyGrid<GridCellClassView>(dayCount, periodCount);
    for (const s of sessions) {
        if (s.room === room) grid[s.day][s.period] = { subject: s.subject, teacher: s.teacher };
    }
    return grid;
}
