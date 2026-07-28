# 📅 課表查詢系統

鳳山高中課表查詢工具。純前端 React 應用，資料來自教務處匯出的 `.xls` 課表，轉換成 JSON 後直接由靜態網站讀取，不需要任何後端或資料庫。

## ✨ 功能特色

- **三種查詢模式**
  - 🏫 **班級模式**：先選年級、再選班級，看該班一週課表
  - 👩‍🏫 **教師模式**：輸入教師姓名（支援模糊搜尋 `datalist`），看該教師一週課表
  - 🔍 **對照模式**：班級與教師課表並排顯示，重疊的節次自動用黃色標示
- 點擊課表中的任一節課，可直接跳轉查看對應教師／班級的課表
- 年級／班級選單完全依實際資料動態產生，不寫死班級數量——之後資料多了幾個年級、幾個班，畫面會自動跟著長出來
- 今天對應的星期會有藍色標記
- 響應式版面，桌機、平板、手機都能正常瀏覽

## 🛠️ 技術棧

| 用途 | 技術 |
|---|---|
| 前端框架 | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| 建置工具 | [Vite](https://vitejs.dev/) |
| xls → JSON 轉換 | Python + [xlrd](https://pypi.org/project/xlrd/)，打包成 Windows `.exe`（[PyInstaller](https://pyinstaller.org/)） |
| 樣式 | 純 CSS（無框架），OKLCH 色彩、`clamp()` 流體字級、`zoom` 等比例縮放 |
| 資料儲存 | 純靜態 JSON 檔（`public/schedule.json`），無後端、無資料庫 |

## 📁 專案結構

```
fssh-courses/
├── data/
│   └── (課表匯出檔，檔名不限，裡面只能放一個檔案)
├── scripts/
│   ├── convert_xls.py      # xls → JSON 轉換腳本；開發時直接跑，或打包成 .exe 給非工程師用
│   └── requirements.txt    # convert_xls.py 執行/打包需要的套件
├── public/
│   ├── fssh-badge.png       # 校徽等靜態資源，正常進版控
│   └── schedule.json        # 轉換產出的課表資料（不進版控，需自行產生）
├── src/
│   ├── components/         # React 元件（ScheduleTable、SingleQuery、CompareView…）
│   ├── hook/
│   │   └── useScheduleData.ts  # 讀取課表資料的自訂 hook
│   ├── lib/                # 純函式（教室代碼解析、grid 建構、今日判斷…）
│   ├── App.tsx
│   ├── main.tsx
│   ├── style.css           # 全站樣式與設計 tokens
│   └── types.ts
└── package.json
```

## 🚀 開始使用

### 環境需求

- Node.js 18 以上（開發時使用 v22）＋ npm，用來跑網站本身（`dev` / `build`）
- Python 3.9 以上，用來跑 `scripts/convert_xls.py` 轉換課表資料

### 安裝套件

```bash
npm install
pip install -r scripts/requirements.txt
```

### 產生課表資料

把教務處匯出的課表檔（`.xls`，檔名不限）放進 `data/` 目錄——**`data/` 裡只能放一個檔案**，轉換腳本會自動抓裡面唯一的那個檔案，放超過一個會直接報錯中止。放好之後執行：

```bash
python scripts/convert_xls.py
```

會轉出 `public/schedule.json`。

> ⚠️ `data/`、`public/schedule.json` 都沒有進版控（含真實姓名等資料），每次 clone 專案都要自行把來源檔放進 `data/` 再重新跑這個指令。

### 給非工程師用的轉換工具（.exe）

如果要讓沒裝 Python 的人（例如教務處人員）自己把 `.xls` 轉成 `schedule.json`，可以把 `scripts/convert_xls.py` 打包成一個 Windows `.exe`，之後只要把 `.xls` 檔案拖曳到這個 `.exe` 圖示上，就會在同一個資料夾產生 `schedule.json`（跟開發模式共用同一份程式，行為差異只在於：有拖曳檔案就轉那個檔案、輸出固定放在 `.exe` 旁邊）。

**打包步驟（PyInstaller 沒辦法跨平台編譯，一定要用 Windows 版 Python 打包才會得到 Windows `.exe`）：**

```powershell
cd scripts
pip install -r requirements.txt
pyinstaller --onefile convert_xls.py
```

> 在 WSL 裡也能做到：只要 Windows 端本身有裝 Python，就可以在 WSL 終端機直接呼叫 Windows 那份 `python.exe`（例如 `/mnt/c/Users/<你的帳號>/AppData/Local/Programs/Python/Python312/python.exe`）建 venv、裝套件、跑 `pyinstaller`，一樣會產生真正的 Windows exe，不用切去另一個視窗操作。

打包完成後，`.exe` 會在 `scripts/dist/convert_xls.exe`，把這一個檔案發給需要轉檔的人即可，不需要對方裝 Python 或 Node.js。

### 開發模式（有 HMR 熱更新）

```bash
npm run dev -- --host
```

啟動後打開終端機顯示的網址（預設 `http://localhost:5173`）。加 `--host` 是為了讓區網／WSL 環境下其他裝置或 Windows 端瀏覽器也能連進來。

### Build 正式版

```bash
npm run build
```

輸出到 `dist/`，是可以直接丟給任何靜態網站伺服器（例如 IIS）的純靜態檔案。

### 本機預覽正式版

```bash
npm run preview -- --host --port 4321
```

跑的是 `dist/` 裡的內容，跟之後實際部署上去的版本完全一樣。

## 📦 部署

這個專案 build 出來就是純靜態檔案（HTML/CSS/JS + JSON），沒有任何 server-side 邏輯，可以直接放到：

- IIS（Windows Server）
- Nginx / Apache
- 任何靜態網站託管服務

只要把 `dist/` 的內容整個複製到網站根目錄即可，不需要安裝 Node.js 或任何執行環境。

## 🔄 資料更新流程

`schedule.json` 是網頁在**執行時**用 `fetch` 讀取的（不是 build 時內嵌進 JS），所以只換資料的話**不需要重新 build、也不需要動 `dist/` 裡其他檔案**，直接覆蓋伺服器上的 `schedule.json` 就會生效。

- **只換資料**：用 [`convert_xls.exe`](#給非工程師用的轉換工具exe)（或直接跑 `python scripts/convert_xls.py`）把新的 `.xls` 轉成 `schedule.json`，直接覆蓋到伺服器網站根目錄下的 `schedule.json`（例如 IIS 站台資料夾）即可，不需要重新整包部署
- **改了程式碼／UI**：才需要照原本的流程重新 build 整包部署：
  1. 拿到新版課表匯出檔，覆蓋掉 `data/` 裡原本的檔案（確保裡面永遠只有一個檔案）
  2. `python scripts/convert_xls.py && npm run build`
  3. 把新的 `dist/` 內容整個覆蓋到伺服器上

---

Developed by [Okowa](https://github.com/Okowa0814) 🚀
