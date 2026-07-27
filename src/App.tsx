import { useState } from 'react';

import { useScheduleData } from './hook/useScheduleData';

import { CompareView, SingleQuery, ModeSwitch } from './components';

import type { Mode, ScheduleData } from './types';

export function App() {
    const state = useScheduleData();

    if (state.status === 'loading') {
        return (
            <div className="page">
                <p className="state-message">課表載入中…</p>
            </div>
        );
    }

    if (state.status === 'error') {
        return (
            <div className="page">
                <p className="state-message">課表載入失敗：{state.error}</p>
            </div>
        );
    }

    return <ScheduleApp data={state.data} />;
}

function ScheduleApp({ data }: { data: ScheduleData }) {
    const [mode, setMode] = useState<Mode>('class');

    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

    const [compareRoom, setCompareRoom] = useState<string | null>(null);
    const [compareTeacher, setCompareTeacher] = useState<string | null>(null);

    return (
        <>
        <div className="page">

            <header className="topbar">
                
                <div className="title-block">
                    <h1>課表查詢</h1>
                    <p>查詢班級或教師的每週課表，並可對照兩者的對應節次。</p>
                </div>

                <ModeSwitch mode={mode} onChange={setMode} />
            </header>

            <main>
                {mode === 'compare' ? (
                    <CompareView
                        data={data}
                        room={compareRoom}
                        teacher={compareTeacher}
                        onSelectRoom={setCompareRoom}
                        onSelectTeacher={setCompareTeacher}
                    />
                ) : (
                    <SingleQuery
                        mode={mode}
                        data={data}
                        selectedRoom={selectedRoom}
                        selectedTeacher={selectedTeacher}
                        onSelectRoom={setSelectedRoom}
                        onSelectTeacher={setSelectedTeacher}
                        onJumpToTeacher={(teacher) => {
                            setSelectedTeacher(teacher);
                            setMode('teacher');
                        }}
                        onJumpToRoom={(room) => {
                            setSelectedRoom(room);
                            setMode('class');
                        }}
                    />
                )}
            </main>
        </div>

        <footer className="footer">
            © 2026 鳳山高中 課表查詢 | Developed by{' '}
            <a className="footer-link" href="https://github.com/Okowa0814" target="_blank" rel="noopener noreferrer">
                Okowa
            </a>
        </footer>
        </>
    );
}
