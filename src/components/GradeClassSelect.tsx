import type { GradeGroup } from '../lib/classCode';

interface GradeClassSelectProps {
    gradeGroups: GradeGroup[];
    room: string | null;
    onSelectRoom: (room: string) => void;
    idPrefix: string;
}

export function GradeClassSelect({ gradeGroups, room, onSelectRoom, idPrefix }: GradeClassSelectProps) {
    if (gradeGroups.length === 0) return null;

    const currentGroup = gradeGroups.find((g) => g.classes.some((c) => c.room === room)) ?? gradeGroups[0];
    const currentRoom = gradeGroups.some((g) => g.classes.some((c) => c.room === room)) ? room : currentGroup.classes[0]?.room ?? null;

    const handleGradeChange = (gradeStr: string) => {
        const group = gradeGroups.find((g) => g.grade === Number(gradeStr));
        const firstRoom = group?.classes[0]?.room;
        if (firstRoom) onSelectRoom(firstRoom);
    };

    return (
        <>
            <div className="field">
                <label htmlFor={`${idPrefix}Grade`}>年級</label>
                <select id={`${idPrefix}Grade`} value={currentGroup.grade} onChange={(e) => handleGradeChange(e.target.value)}>
                    {gradeGroups.map((g) => (
                        <option key={g.grade} value={g.grade}>
                            {g.grade}年級
                        </option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label htmlFor={`${idPrefix}Class`}>班級</label>
                <select id={`${idPrefix}Class`} value={currentRoom ?? ''} onChange={(e) => onSelectRoom(e.target.value)}>
                    {currentGroup.classes.map((c) => (
                        <option key={c.room} value={c.room}>
                            {c.classNumber}班
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
}
