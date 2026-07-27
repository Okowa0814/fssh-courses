import type { ClassCode } from '../types';

const CLASS_CODE_PATTERN = /^\d{3}$/;

/**
 * 教室代碼若為 3 碼數字，第 1 碼是年級、後 2 碼是班級（去掉前導 0）。
 * 不符合此格式的教室代碼（例如特別教室）回傳 null，代表無法用「幾年幾班」查詢。
 */
export function parseClassCode(room: string): ClassCode | null {
    if (!CLASS_CODE_PATTERN.test(room)) return null;
    const grade = Number(room[0]);
    const classNumber = Number(room.slice(1));
    return { grade, classNumber, label: `${grade}年${classNumber}班` };
}

export interface GradeGroup {
    grade: number;
    classes: { room: string; classNumber: number }[];
}

/**
 * 依教室代碼實際存在的資料，動態算出有哪些年級、每個年級有幾班。
 * 不假設固定是 1～3 年級或固定班數——資料目前只有 3 年級就只會出現 3 年級，
 * 未來 xls 補上 1、2 年級的教室後，這裡會自動一起列出來，不需要改程式。
 */
export function groupClassesByGrade(rooms: string[]): GradeGroup[] {
    const byGrade = new Map<number, { room: string; classNumber: number }[]>();
    for (const room of rooms) {
        const code = parseClassCode(room);
        if (!code) continue;
        const list = byGrade.get(code.grade) ?? [];
        list.push({ room, classNumber: code.classNumber });
        byGrade.set(code.grade, list);
    }
    return Array.from(byGrade.entries())
        .sort(([a], [b]) => a - b)
        .map(([grade, classes]) => ({
            grade,
            classes: classes.sort((a, b) => a.classNumber - b.classNumber)
        }));
}
