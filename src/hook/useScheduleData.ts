/*

import.meta.env.BASE_URL -> vite.config.ts base
cancelled flag -> when the component is unmounted, to prevent state updates

*/

import { useEffect, useState } from 'react';
import type { ScheduleData } from '../types';

type State =
    | { status: 'loading' }
    | { status: 'error'; error: string }
    | { status: 'ready'; data: ScheduleData };

let cached: ScheduleData | null = null;
let inflight: Promise<ScheduleData> | null = null;

function getScheduleData(): Promise<ScheduleData> {
    if (cached) return Promise.resolve(cached);

    if (!inflight) {
        inflight = fetch(`${import.meta.env.BASE_URL}schedule.json?t=${Date.now()}`, { cache: 'no-store' })
            .then((res) => {
                if (!res.ok) throw new Error(`無法載入課表資料（HTTP ${res.status}）`);
                return res.json() as Promise<ScheduleData>;
            })
            .then((data) => {
                cached = data;
                return data;
            });
    }

    return inflight;
}

export function useScheduleData(): State {
    const [state, setState] = useState<State>(
        cached ? { status: 'ready', data: cached } : { status: 'loading' }
    );

    useEffect(() => {
        if (cached) return;

        let cancelled = false;

        getScheduleData()
            .then((data) => {
                if (!cancelled) setState({ status: 'ready', data });
            })
            .catch((err: unknown) => {
                if (!cancelled) setState({ status: 'error', error: err instanceof Error ? err.message : String(err) });
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return state;
}
