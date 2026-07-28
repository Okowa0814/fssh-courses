import type { ClassCode } from '../types';

const CLASS_CODE_PATTERN = /^\d{3}$/;

/*
- Parse a class code string into a ClassCode object
- If the input string is not a valid class code, return null
*/
export function parseClassCode(room: string): ClassCode | null {
    if (!CLASS_CODE_PATTERN.test(room)) return null;

    const grade = Number(room[0]);
    const classNumber = Number(room.slice(1));

    return { grade, classNumber, label: `${grade}年${classNumber}班` };
}

/*
- Dynamically generate a list of GradeGroup objects from a list of room strings
- Each GradeGroup contains a grade number and a list of classes (room and classNumber)
- The classes within each grade are sorted by classNumber
*/

export interface GradeGroup {
    grade: number;
    classes: { room: string; classNumber: number }[];
}

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
