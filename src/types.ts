export interface Period {
    index: number;
    label: string;
    start: string;
    end: string;
}

export interface Session {
    teacher: string;
    room: string;
    day: number;
    period: number;
    subject: string;
}

export interface ScheduleData {
    periods: Period[];
    days: string[];
    teachers: string[];
    rooms: string[];
    sessions: Session[];
}

export type Mode = 'class' | 'teacher' | 'compare';

export interface ClassCode {
    grade: number;
    classNumber: number;
    label: string;
}

export interface GridCellTeacherView {
    subject: string;
    room: string;
}

export interface GridCellClassView {
    subject: string;
    teacher: string;
}
