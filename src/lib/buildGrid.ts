import type { GridCellClassView, GridCellTeacherView, Session } from '../types';
import { parseClassCode } from './classCode';

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

/**
 * 依教室代碼（班級代稱）篩選 sessions，組成 day x period 矩陣，每格顯示科目 + 教師。
 * 同一教室代稱同一時段若被多位教師共用（跑班/協同課程），無法對應單一教師，
 * 該格只顯示科目、teacher 為 null（不可跳轉）。
 */
export function buildRoomGrid(
    sessions: Session[],
    room: string,
    dayCount: number,
    periodCount: number
): (GridCellClassView | null)[][] {
    const grid = createEmptyGrid<GridCellClassView>(dayCount, periodCount);
    for (const s of sessions) {
        if (s.room !== room) continue;
        const existing = grid[s.day][s.period];
        if (existing && existing.teacher !== s.teacher) {
            grid[s.day][s.period] = { subject: s.subject, teacher: null };
            continue;
        }
        grid[s.day][s.period] = { subject: s.subject, teacher: s.teacher };
    }

    // 跑班/選修課（多元選修、彈性學習等）的「教室」欄位記的是課程名稱、不是班級代碼，
    // 匯出檔裡沒有「哪個班被分到哪個組」的對應關係，沒辦法得知這個班實際上的老師與分組。
    // 只能在這個班原本完全沒排課的格子，補上當下全校同時段在跑的課程名稱、不顯示教師。
    for (const s of sessions) {
        if (parseClassCode(s.room) !== null) continue;
        if (grid[s.day][s.period]) continue;
        grid[s.day][s.period] = { subject: s.subject, teacher: null };
    }

    return grid;
}
