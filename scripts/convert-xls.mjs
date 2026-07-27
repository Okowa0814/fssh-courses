// 把 data/ 目錄底下唯一的檔案（教師課表匯出檔，檔名不限）轉成 public/schedule.json。
// 執行方式：npm run data（或 npm run release 會自動先跑這個再 build）。
//
// 資料格式假設（已用實際檔案驗證過）：
// - 每位教師的區塊固定 48 列，區塊起點是第 0 欄等於「教師:」的那一列。
// - 教師姓名在 (teacherRow, col 2)。
// - 星期一～五對應欄位 4/6/8/10/12（週六在來源檔案裡一律是空的，依需求不輸出）。
// - 第一節～第八節共 8 個節次（早自習、第九節在來源檔案裡一律是空的，依需求不輸出），從 teacherRow-2+10 開始，每節間隔 4 列；
//   節次的第一列是科目、下一列是教室。
//
// 未來若學校匯出更多教師，只要維持同樣格式，這裡的區塊掃描與驗證邏輯會自動套用，
// 不需要修改程式。若格式跑掉（區塊高度不是 48），腳本會直接丟錯中止，避免產生錯誤資料。

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
// 注意：package.json 沒有 "exports" 欄位，Node 的 ESM 解析會走 "main"（CJS 版 xlsx.js），
// 而 CJS 版沒有輸出 set_cptable/readFile 等函式。必須直接指到 ESM 版檔案 xlsx.mjs 才拿得到。
import * as XLSX from 'xlsx/xlsx.mjs';

// xlsx 套件預設不包含舊版 codepage 對照表（為了縮小瀏覽器端體積），
// 這份 xls 沒有 CODEPAGE 記錄、文字是 Big5，若不載入這個對照表，
// { codepage: 950 } 選項不會生效，中文會變成亂碼。
import * as cptable from 'xlsx/dist/cpexcel.full.mjs';
XLSX.set_cptable(cptable);

// 同理，ESM 版不會自動偵測 Node 環境並 require('fs')，要自己注入，
// 否則 XLSX.readFile 內部找不到檔案系統，會丟出「Cannot access file」的誤導訊息。
XLSX.set_fs(fs);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');
const OUTPUT_JSON = path.resolve(__dirname, '../public/schedule.json');

function resolveSourceXls() {
    if (!fs.existsSync(DATA_DIR)) {
        throw new Error(`找不到資料目錄：${DATA_DIR}`);
    }
    const entries = fs.readdirSync(DATA_DIR).filter((name) => !name.startsWith('.'));
    if (entries.length === 0) {
        throw new Error(`${DATA_DIR} 是空的，請把課表匯出檔（.xls）放進去`);
    }
    if (entries.length > 1) {
        throw new Error(`${DATA_DIR} 裡應該只放一個檔案，目前偵測到 ${entries.length} 個：${entries.join('、')}`);
    }
    return path.join(DATA_DIR, entries[0]);
}

const SOURCE_XLS = resolveSourceXls();

// 週六欄位在來源檔案中一律是空的（學校沒有排週六的課），依需求不輸出這一欄。
const DAYS = ['一', '二', '三', '四', '五'];
const DAY_COLUMNS = [4, 6, 8, 10, 12];

const PERIODS = [
    { index: 0, label: '第一節', start: '08:00', end: '08:50' },
    { index: 1, label: '第二節', start: '09:00', end: '09:50' },
    { index: 2, label: '第三節', start: '10:10', end: '11:00' },
    { index: 3, label: '第四節', start: '11:10', end: '12:00' },
    { index: 4, label: '第五節', start: '13:15', end: '14:05' },
    { index: 5, label: '第六節', start: '14:15', end: '15:05' },
    { index: 6, label: '第七節', start: '15:15', end: '16:05' },
    { index: 7, label: '第八節', start: '16:10', end: '17:00' }
];

const BLOCK_HEIGHT = 48;
// 早自習那一節在來源檔案裡一律是空的，依需求不輸出；第一節的科目列在 block 起點 +10（跳過早自習的 3 列 + 1 列間隔）。
const FIRST_PERIOD_OFFSET = 10; // 相對於 block 起點（teacherRow - 2）
const PERIOD_ROW_STEP = 4;

function cellText(value) {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text === '' ? null : text;
}

function main() {
    const workbook = XLSX.readFile(SOURCE_XLS, { codepage: 950 });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    /** @type {any[][]} */
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });

    const teacherRowIndexes = [];
    rows.forEach((row, i) => {
        if (cellText(row[0]) === '教師:') teacherRowIndexes.push(i);
    });

    if (teacherRowIndexes.length === 0) {
        throw new Error('沒有找到任何「教師:」區塊，來源檔案格式可能已改變');
    }

    const teachers = [];
    const roomSet = new Set();
    const sessions = [];

    teacherRowIndexes.forEach((teacherRow, blockIdx) => {
        const teacherName = cellText(rows[teacherRow][2]);
        if (!teacherName) {
            throw new Error(`第 ${teacherRow + 1} 列的教師區塊找不到教師姓名`);
        }

        const blockStart = teacherRow - 2;
        const isLastBlock = blockIdx === teacherRowIndexes.length - 1;

        if (!isLastBlock) {
            const nextTeacherRow = teacherRowIndexes[blockIdx + 1];
            const actualHeight = nextTeacherRow - teacherRow;
            if (actualHeight !== BLOCK_HEIGHT) {
                throw new Error(
                    `教師「${teacherName}」（第 ${teacherRow + 1} 列）區塊高度異常：預期 ${BLOCK_HEIGHT} 列，實際 ${actualHeight} 列`
                );
            }
        } else if (blockStart + BLOCK_HEIGHT > rows.length) {
            throw new Error(`教師「${teacherName}」（第 ${teacherRow + 1} 列）的區塊超出檔案範圍，來源檔案可能被截斷`);
        }

        teachers.push(teacherName);

        PERIODS.forEach((period, periodIdx) => {
            const subjectRow = blockStart + FIRST_PERIOD_OFFSET + periodIdx * PERIOD_ROW_STEP;
            const roomRow = subjectRow + 1;

            DAY_COLUMNS.forEach((col, dayIdx) => {
                const subject = cellText(rows[subjectRow]?.[col]);
                if (!subject) return;
                const room = cellText(rows[roomRow]?.[col]) ?? '';
                roomSet.add(room);
                sessions.push({ teacher: teacherName, room, day: dayIdx, period: period.index, subject });
            });
        });
    });

    // 同一教室同一天同一節不應被兩位教師同時占用，這是「教室代稱班級」設計的前提假設。
    const seenSlots = new Map();
    for (const session of sessions) {
        if (!session.room) continue;
        const key = `${session.room}|${session.day}|${session.period}`;
        const existing = seenSlots.get(key);
        if (existing && existing.teacher !== session.teacher) {
            throw new Error(
                `教室 ${session.room} 週${DAYS[session.day]} 第${session.period + 1}節同時被 ${existing.teacher} 與 ${session.teacher} 占用，違反教室代稱班級的假設`
            );
        }
        seenSlots.set(key, session);
    }

    const rooms = Array.from(roomSet).filter(Boolean).sort();

    const data = {
        periods: PERIODS,
        days: DAYS,
        teachers,
        rooms,
        sessions
    };

    fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(data, null, 4), 'utf-8');

    console.log(`轉換完成：${teachers.length} 位教師、${rooms.length} 間教室、${sessions.length} 筆課節`);
    console.log(`輸出：${OUTPUT_JSON}`);
}

main();
