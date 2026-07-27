import { useEffect, useState } from 'react';

interface TeacherComboboxProps {
    teachers: string[];
    teacher: string | null;
    onSelectTeacher: (teacher: string) => void;
    idPrefix: string;
    label?: string;
}

export function TeacherCombobox({ teachers, teacher, onSelectTeacher, idPrefix, label = '教師' }: TeacherComboboxProps) {
    const [inputValue, setInputValue] = useState(teacher ?? '');

    useEffect(() => {
        setInputValue(teacher ?? '');
    }, [teacher]);

    const handleChange = (value: string) => {
        setInputValue(value);
        // datalist 只是輸入建議，使用者可能打到一半、或打錯字，
        // 只有打出完全符合的教師姓名時才真的切換課表，避免每個按鍵都去查一個不存在的老師。
        if (teachers.includes(value)) onSelectTeacher(value);
    };

    return (
        <div className="field">
            <label htmlFor={`${idPrefix}Teacher`}>{label}</label>
            <input
                id={`${idPrefix}Teacher`}
                list={`${idPrefix}TeacherList`}
                value={inputValue}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="輸入教師姓名"
                autoComplete="off"
            />
            <datalist id={`${idPrefix}TeacherList`}>
                {teachers.map((t) => (
                    <option key={t} value={t} />
                ))}
            </datalist>
        </div>
    );
}
