import type { Period } from '../types';

interface ScheduleTableProps<T extends { subject: string }> {
    title: string;
    grid: (T | null)[][];
    periods: Period[];
    days: string[];
    todayIndex: number;
    whoOf: (cell: T) => string;
    onCellActivate?: (cell: T) => void;
    canActivate?: (cell: T) => boolean;
    isMatch?: (day: number, period: number, cell: T) => boolean;
}

export function ScheduleTable<T extends { subject: string }>({
    title,
    grid,
    periods,
    days,
    todayIndex,
    whoOf,
    onCellActivate,
    canActivate,
    isMatch
}: ScheduleTableProps<T>) {
    return (
        <div className="table-card">
            <div className="table-card-head">
                <h2>{title}</h2>
            </div>
            <div className="table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th className="corner" scope="col" />
                            {days.map((d, i) =>
                                i === todayIndex ? (
                                    <th key={d} scope="col" className="is-today" aria-label={`週${d}，今天`}>
                                        週{d}
                                    </th>
                                ) : (
                                    <th key={d} scope="col">
                                        週{d}
                                    </th>
                                )
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {periods.map((period, p) => (
                            <tr key={period.index}>
                                <th scope="row">{period.label}</th>
                                {days.map((d, dIdx) => {
                                    const cell = grid[dIdx]?.[p] ?? null;

                                    if (!cell) {
                                        return (
                                            <td key={d} className="cell empty" aria-label={`週${d} 第${p + 1}節，無安排`}>
                                                —
                                            </td>
                                        );
                                    }

                                    const who = whoOf(cell);
                                    const interactive = Boolean(onCellActivate) && (canActivate ? canActivate(cell) : true);
                                    const matched = isMatch ? isMatch(dIdx, p, cell) : false;
                                    const className = ['cell', 'filled', matched ? 'match' : ''].filter(Boolean).join(' ');

                                    const activate = () => {
                                        if (interactive) onCellActivate?.(cell);
                                    };

                                    return (
                                        <td
                                            key={d}
                                            className={className}
                                            role={interactive ? 'button' : undefined}
                                            tabIndex={interactive ? 0 : undefined}
                                            aria-label={`週${d} 第${p + 1}節，${cell.subject}，${who}`}
                                            onClick={interactive ? activate : undefined}
                                            onKeyDown={
                                                interactive
                                                    ? (e) => {
                                                          if (e.key === 'Enter' || e.key === ' ') {
                                                              e.preventDefault();
                                                              activate();
                                                          }
                                                      }
                                                    : undefined
                                            }
                                        >
                                            <span className="subject">{cell.subject}</span>
                                            <span className="who">{who}</span>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
