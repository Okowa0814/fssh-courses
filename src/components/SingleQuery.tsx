import { useMemo } from 'react';
import type { ScheduleData } from '../types';
import { parseClassCode, groupClassesByGrade } from '../lib/classCode';
import { buildRoomGrid, buildTeacherGrid } from '../lib/buildGrid';
import { todayDayIndex } from '../lib/today';
import { ScheduleTable } from './ScheduleTable';
import { GradeClassSelect } from './GradeClassSelect';
import { TeacherCombobox } from './TeacherCombobox';

interface SingleQueryProps {
    mode: 'class' | 'teacher';
    data: ScheduleData;
    
    selectedRoom: string | null;
    selectedTeacher: string | null;

    onSelectRoom: (room: string) => void;
    onSelectTeacher: (teacher: string) => void;

    onJumpToTeacher: (teacher: string) => void;
    onJumpToRoom: (room: string) => void;
}

export function SingleQuery({
    mode,
    data,
    selectedRoom,
    selectedTeacher,
    onSelectRoom,
    onSelectTeacher,
    onJumpToTeacher,
    onJumpToRoom
}: SingleQueryProps) {
    const gradeGroups = useMemo(() => groupClassesByGrade(data.rooms), [data.rooms]);

    const todayIndex = todayDayIndex(data.days);

    if (mode === 'class') {
        const room = selectedRoom && parseClassCode(selectedRoom) ? selectedRoom : gradeGroups[0]?.classes[0]?.room ?? null;
        const label = room ? parseClassCode(room)?.label ?? room : '';
        const grid = room ? buildRoomGrid(data.sessions, room, data.days.length, data.periods.length) : null;

        return (
            <>
                <section className="controls">
                    <GradeClassSelect gradeGroups={gradeGroups} room={room} onSelectRoom={onSelectRoom} idPrefix="class" />
                </section>
                {grid && (
                    <ScheduleTable
                        title={`${label} 課表`}
                        grid={grid}
                        periods={data.periods}
                        days={data.days}
                        todayIndex={todayIndex}
                        whoOf={(cell) => cell.teacher}
                        onCellActivate={(cell) => onJumpToTeacher(cell.teacher)}
                    />
                )}
                <p className="hint">點擊課表中的課程，可跳轉查看該教師的課表。</p>
            </>
        );
    }

    const teacher = selectedTeacher ?? data.teachers[0] ?? null;
    const grid = teacher ? buildTeacherGrid(data.sessions, teacher, data.days.length, data.periods.length) : null;

    return (
        <>
            <section className="controls">
                <TeacherCombobox teachers={data.teachers} teacher={teacher} onSelectTeacher={onSelectTeacher} idPrefix="single" label="選擇教師 (可輸入關鍵詞搜尋)" />
            </section>
            {grid && (
                <ScheduleTable
                    title={`${teacher} 課表`}
                    grid={grid}
                    periods={data.periods}
                    days={data.days}
                    todayIndex={todayIndex}
                    whoOf={(cell) => cell.room}
                    onCellActivate={(cell) => onJumpToRoom(cell.room)}
                    canActivate={(cell) => parseClassCode(cell.room) !== null}
                />
            )}
            <p className="hint">點擊課表中的課程，可跳轉查看該教室（班級）的課表。</p>
        </>
    );
}
