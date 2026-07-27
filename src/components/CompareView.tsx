import { useMemo } from 'react';
import type { ScheduleData } from '../types';
import { parseClassCode, groupClassesByGrade } from '../lib/classCode';
import { buildRoomGrid, buildTeacherGrid } from '../lib/buildGrid';
import { todayDayIndex } from '../lib/today';
import { ScheduleTable } from './ScheduleTable';
import { GradeClassSelect } from './GradeClassSelect';
import { TeacherCombobox } from './TeacherCombobox';

interface CompareViewProps {
    data: ScheduleData;
    room: string | null;
    teacher: string | null;
    onSelectRoom: (room: string) => void;
    onSelectTeacher: (teacher: string) => void;
}

export function CompareView({ data, room, teacher, onSelectRoom, onSelectTeacher }: CompareViewProps) {
    const gradeGroups = useMemo(() => groupClassesByGrade(data.rooms), [data.rooms]);

    const currentRoom = room && parseClassCode(room) ? room : gradeGroups[0]?.classes[0]?.room ?? null;
    const currentTeacher = teacher ?? data.teachers[0] ?? null;
    const todayIndex = todayDayIndex(data.days);

    if (!currentRoom || !currentTeacher) return null;

    const roomLabel = parseClassCode(currentRoom)?.label ?? currentRoom;
    const roomGrid = buildRoomGrid(data.sessions, currentRoom, data.days.length, data.periods.length);
    const teacherGrid = buildTeacherGrid(data.sessions, currentTeacher, data.days.length, data.periods.length);
    const overlapCount = data.sessions.filter((s) => s.room === currentRoom && s.teacher === currentTeacher).length;

    return (
        <>
            <section className="compare-field">
                <GradeClassSelect gradeGroups={gradeGroups} room={currentRoom} onSelectRoom={onSelectRoom} idPrefix="compare" />
                <TeacherCombobox teachers={data.teachers} teacher={currentTeacher} onSelectTeacher={onSelectTeacher} idPrefix="compare" />
            </section>

            <p className={`compare-summary${overlapCount === 0 ? ' is-zero' : ''}`} aria-live="polite">
                {overlapCount > 0 ? (
                    <>
                        {roomLabel} 與 {currentTeacher}，本週共有 <span className="count">{overlapCount}</span> 節相互對應。
                    </>
                ) : (
                    <>
                        {roomLabel} 與 {currentTeacher}，本週沒有相互對應的課節。
                    </>
                )}
            </p>

            <div className="compare-grid">
                <ScheduleTable
                    title={`${roomLabel} 課表`}
                    grid={roomGrid}
                    periods={data.periods}
                    days={data.days}
                    todayIndex={todayIndex}
                    whoOf={(cell) => cell.teacher}
                    onCellActivate={(cell) => onSelectTeacher(cell.teacher)}
                    isMatch={(_d, _p, cell) => cell.teacher === currentTeacher}
                />
                <ScheduleTable
                    title={`${currentTeacher} 課表`}
                    grid={teacherGrid}
                    periods={data.periods}
                    days={data.days}
                    todayIndex={todayIndex}
                    whoOf={(cell) => cell.room}
                    onCellActivate={(cell) => onSelectRoom(cell.room)}
                    canActivate={(cell) => parseClassCode(cell.room) !== null}
                    isMatch={(_d, _p, cell) => cell.room === currentRoom}
                />
            </div>
            <p className="hint">對照模式：黃色高亮代表這位教師與這個班級在該節課相互對應。</p>
        </>
    );
}
