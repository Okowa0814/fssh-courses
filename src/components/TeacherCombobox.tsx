import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

interface TeacherComboboxProps {
    teachers: string[];
    teacher: string | null;
    onSelectTeacher: (teacher: string) => void;
    idPrefix: string;
    label?: string;
}

export function TeacherCombobox({ teachers, teacher, onSelectTeacher, idPrefix, label = '教師' }: TeacherComboboxProps) {
    // 搜尋欄只負責「打字找教師」，不會因為切換課表（跳轉、對照模式互選）而被目前選中的教師姓名自動填入。
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = useMemo(() => {
        const q = inputValue.trim();
        return q ? teachers.filter((t) => t.includes(q)) : teachers;
    }, [teachers, inputValue]);

    useEffect(() => {
        setHighlightIndex(0);
    }, [inputValue, isOpen]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const commit = (value: string) => {
        setInputValue(value);
        onSelectTeacher(value);
        setIsOpen(false);
        // 選完就讓輸入框失焦，手機上的虛擬鍵盤才會跟著收起來。
        inputRef.current?.blur();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
            setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            if (isOpen && filtered[highlightIndex]) {
                e.preventDefault();
                commit(filtered[highlightIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div className="field combobox" ref={rootRef}>
            <label htmlFor={`${idPrefix}Teacher`}>{label}</label>
            <div className="combobox-control">
                <input
                    ref={inputRef}
                    id={`${idPrefix}Teacher`}
                    type="text"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-autocomplete="list"
                    autoComplete="off"
                    value={inputValue}
                    placeholder="輸入教師姓名"
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                />
                {isOpen && (
                    <ul className="combobox-list" role="listbox">
                        {filtered.length > 0 ? (
                            filtered.map((t, i) => (
                                <li
                                    key={t}
                                    role="option"
                                    aria-selected={t === teacher}
                                    className={`combobox-option${i === highlightIndex ? ' active' : ''}`}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        commit(t);
                                    }}
                                    onMouseEnter={() => setHighlightIndex(i)}
                                >
                                    {t}
                                </li>
                            ))
                        ) : (
                            <li className="combobox-empty">查無教師</li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}
