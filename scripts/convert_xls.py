# 把課表匯出檔（.xls）轉成 schedule.json。有兩種用法：
# - 開發時：npm 環境下直接跑 `python scripts/convert_xls.py`（不帶參數），
#   會自動抓 data/ 目錄底下唯一的檔案，輸出到 public/schedule.json。
# - 打包成 convert_xls.exe 後給非工程師用：把 .xls 檔案拖曳到 exe 圖示上，
#   Windows 會把檔案路徑當成命令列參數傳進來（sys.argv[1]），輸出到 exe 所在目錄。
#
# 資料格式假設（已用實際檔案驗證過）：
# - 每位教師的區塊固定 48 列，區塊起點是第 0 欄等於「教師:」的那一列。
# - 教師姓名在 (teacherRow, col 2)。
# - 星期一～五對應欄位 4/6/8/10/12（週六在來源檔案裡一律是空的，依需求不輸出）。
# - 第一節～第八節共 8 個節次（早自習、第九節在來源檔案裡一律是空的，依需求不輸出），
#   從 teacherRow-2+10 開始，每節間隔 4 列；節次的第一列是科目、下一列是教室。
#
# 未來若學校匯出更多教師，只要維持同樣格式，這裡的區塊掃描與驗證邏輯會自動套用，
# 不需要修改程式。若格式跑掉（區塊高度不是 48），程式會直接印出錯誤並中止，避免產生錯誤資料。

import json
import sys
from pathlib import Path

import xlrd

if sys.platform == 'win32':
    # Windows 主控台預設用系統 codepage（如 cp950），跟 Python 輸出的 UTF-8 對不上，
    # 中文字會變亂碼；這裡把主控台輸出的 codepage 跟 stdout 都切成 UTF-8。
    import ctypes

    ctypes.windll.kernel32.SetConsoleOutputCP(65001)
    sys.stdout.reconfigure(encoding='utf-8')

DAYS = ['一', '二', '三', '四', '五']
DAY_COLUMNS = [4, 6, 8, 10, 12]

PERIODS = [
    {'index': 0, 'label': '第一節', 'start': '08:00', 'end': '08:50'},
    {'index': 1, 'label': '第二節', 'start': '09:00', 'end': '09:50'},
    {'index': 2, 'label': '第三節', 'start': '10:10', 'end': '11:00'},
    {'index': 3, 'label': '第四節', 'start': '11:10', 'end': '12:00'},
    {'index': 4, 'label': '第五節', 'start': '13:15', 'end': '14:05'},
    {'index': 5, 'label': '第六節', 'start': '14:15', 'end': '15:05'},
    {'index': 6, 'label': '第七節', 'start': '15:15', 'end': '16:05'},
    {'index': 7, 'label': '第八節', 'start': '16:10', 'end': '17:00'},
]

BLOCK_HEIGHT = 48
# 早自習那一節在來源檔案裡一律是空的，依需求不輸出；第一節的科目列在 block 起點 +10（跳過早自習的 3 列 + 1 列間隔）。
FIRST_PERIOD_OFFSET = 10  # 相對於 block 起點（teacherRow - 2）
PERIOD_ROW_STEP = 4


def cell_text(sheet, row, col):
    if row < 0 or row >= sheet.nrows or col < 0 or col >= sheet.ncols:
        return None
    value = sheet.cell(row, col).value
    if value is None:
        return None
    if isinstance(value, float) and value == int(value):
        value = int(value)
    text = str(value).strip()
    return text if text else None


def is_frozen():
    return getattr(sys, 'frozen', False)


def project_root():
    if is_frozen():
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent


def output_path():
    if is_frozen():
        return Path(sys.executable).resolve().parent / 'schedule.json'
    return project_root() / 'public' / 'schedule.json'


def resolve_source_from_data_dir():
    data_dir = project_root() / 'data'
    if not data_dir.exists():
        raise FileNotFoundError(f'找不到資料目錄：{data_dir}')
    entries = sorted(p for p in data_dir.iterdir() if not p.name.startswith('.'))
    if not entries:
        raise FileNotFoundError(f'{data_dir} 是空的，請把課表匯出檔（.xls）放進去')
    if len(entries) > 1:
        names = '、'.join(p.name for p in entries)
        raise FileNotFoundError(f'{data_dir} 裡應該只放一個檔案，目前偵測到 {len(entries)} 個：{names}')
    return entries[0]


def convert(source_path: Path) -> dict:
    # 這份 xls 沒有 CODEPAGE 記錄、文字是 Big5，不指定 encoding_override 的話中文會變成亂碼。
    workbook = xlrd.open_workbook(str(source_path), encoding_override='cp950')
    sheet = workbook.sheet_by_index(0)

    teacher_row_indexes = [
        row for row in range(sheet.nrows) if cell_text(sheet, row, 0) == '教師:'
    ]

    if not teacher_row_indexes:
        raise ValueError('沒有找到任何「教師:」區塊，來源檔案格式可能已改變')

    teachers = []
    room_set = set()
    sessions = []

    for block_idx, teacher_row in enumerate(teacher_row_indexes):
        teacher_name = cell_text(sheet, teacher_row, 2)
        if not teacher_name:
            raise ValueError(f'第 {teacher_row + 1} 列的教師區塊找不到教師姓名')

        block_start = teacher_row - 2
        is_last_block = block_idx == len(teacher_row_indexes) - 1

        if not is_last_block:
            next_teacher_row = teacher_row_indexes[block_idx + 1]
            actual_height = next_teacher_row - teacher_row
            if actual_height != BLOCK_HEIGHT:
                raise ValueError(
                    f'教師「{teacher_name}」（第 {teacher_row + 1} 列）區塊高度異常：'
                    f'預期 {BLOCK_HEIGHT} 列，實際 {actual_height} 列'
                )
        elif block_start + BLOCK_HEIGHT > sheet.nrows:
            raise ValueError(
                f'教師「{teacher_name}」（第 {teacher_row + 1} 列）的區塊超出檔案範圍，來源檔案可能被截斷'
            )

        teachers.append(teacher_name)

        for period_idx, period in enumerate(PERIODS):
            subject_row = block_start + FIRST_PERIOD_OFFSET + period_idx * PERIOD_ROW_STEP
            room_row = subject_row + 1

            for day_idx, col in enumerate(DAY_COLUMNS):
                subject = cell_text(sheet, subject_row, col)
                if not subject:
                    continue
                room = cell_text(sheet, room_row, col) or ''
                room_set.add(room)
                sessions.append({
                    'teacher': teacher_name,
                    'room': room,
                    'day': day_idx,
                    'period': period['index'],
                    'subject': subject,
                })

    # 同一教室同一天同一節不應被兩位教師同時占用，這是「教室代稱班級」設計的前提假設。
    seen_slots = {}
    for session in sessions:
        if not session['room']:
            continue
        key = (session['room'], session['day'], session['period'])
        existing = seen_slots.get(key)
        if existing and existing['teacher'] != session['teacher']:
            raise ValueError(
                f"教室 {session['room']} 週{DAYS[session['day']]} 第{session['period'] + 1}節同時被 "
                f"{existing['teacher']} 與 {session['teacher']} 占用，違反教室代稱班級的假設"
            )
        seen_slots[key] = session

    rooms = sorted(r for r in room_set if r)

    return {
        'periods': PERIODS,
        'days': DAYS,
        'teachers': teachers,
        'rooms': rooms,
        'sessions': sessions,
    }


def main():
    output_json = output_path()

    try:
        if len(sys.argv) >= 2:
            source_path = Path(sys.argv[1])
            if not source_path.exists():
                raise FileNotFoundError(f'找不到檔案：{source_path}')
        elif is_frozen():
            print('用法：把課表匯出檔（.xls）拖曳到這個程式的圖示上即可。')
            input('按 Enter 關閉…')
            sys.exit(1)
        else:
            source_path = resolve_source_from_data_dir()

        data = convert(source_path)
        output_json.write_text(
            json.dumps(data, ensure_ascii=False, indent=4),
            encoding='utf-8',
        )
        print(f"轉換完成：{len(data['teachers'])} 位教師、{len(data['rooms'])} 間教室、{len(data['sessions'])} 筆課節")
        print(f'輸出：{output_json}')
        if is_frozen():
            input('按 Enter 關閉…')
    except Exception as exc:  # noqa: BLE001 - 給非工程師使用者看的錯誤訊息，故意攔截所有例外
        print(f'轉換失敗：{exc}')
        if is_frozen():
            input('按 Enter 關閉…')
        sys.exit(1)


if __name__ == '__main__':
    main()
