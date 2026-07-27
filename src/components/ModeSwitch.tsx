import type { Mode } from '../types';

const MODES: { value: Mode; label: string }[] = [
    { value: 'class', label: '班級' },
    { value: 'teacher', label: '教師' },
    { value: 'compare', label: '對照' }
];

interface ModeSwitchProps {
    mode: Mode;
    onChange: (mode: Mode) => void;
}

export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
    return (
        <div className="mode-switch" role="group" aria-label="查詢模式">
            {MODES.map((m) => (
                <button
                    key={m.value}
                    type="button"
                    className={`mode-btn${mode === m.value ? ' active' : ''}`}
                    aria-pressed={mode === m.value}
                    onClick={() => onChange(m.value)}
                >
                    {m.label}
                </button>
            ))}
        </div>
    );
}
