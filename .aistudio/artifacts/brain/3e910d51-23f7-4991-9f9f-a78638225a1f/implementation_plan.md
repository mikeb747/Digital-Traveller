# Desktop Packaging & Network Share Excel (.xlsx) Integration Plan

This plan establishes the architecture for packaging the Digital Traveller into a native desktop application (using Electron) capable of directly reading, writing, and synchronizing with Excel (`.xlsx`) spreadsheets located on local company network shares (`\\server\share\...`).

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural parameters have been confirmed based on your workflow needs:

- **Confirmed Decision 1 (Packaging Architecture)**: Desktop application (Electron) with native file system and network drive permissions. Unlike browser-only sandboxes that block direct unc-path (`\\server\share\file.xlsx`) access, an Electron desktop wrapper allows seamless, transparent read/write access to mapped network drives and UNC paths.
- **Confirmed Decision 2 (Spreadsheet Format)**: Native `.xlsx` binary workbook format. The application will use an industry-standard in-memory Excel engine (`xlsx` / `exceljs`) to parse existing production templates, update test records/rows, and save directly back without corrupting formatting, formulas, or metadata.
- **Recommended Default (Dual-Mode Execution)**: The core web application remains 100% functional in any web browser with local fallback (save/open JSON & manual export), while lighting up direct network share spreadsheet sync automatically when launched in the desktop `.exe`.

---

### 1. Overview & Core Concept

- **What It Does**: Transforms the Digital Traveller into a Windows desktop application that can automatically open work orders from existing Excel production logbooks on a shared network drive (`\\share\manufacturing\travellers.xlsx`), allow technicians to complete test stages, and automatically append or update verification records directly back into the network spreadsheet upon stage completion.
- **Target Audience / Persona**: Manufacturing technicians, test engineers, and quality assurance leads running production procedures on shop-floor PCs.
- **Key Value**: Eliminates manual double-entry. Technicians complete testing on the interactive digital UI, and the company's shared network Excel sheets are kept up-to-date in real time.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Configure Network Path**: Admin accesses Settings $\to$ Network Share Settings to specify the target `.xlsx` path (e.g. `Z:\Production\Travellers_2026.xlsx` or `\\corp\shares\QA\Records.xlsx`).
  2. **Automated Row Lookup**: Entering or scanning a Serial Number or Job Number in the top bar scans the network spreadsheet for matching historical entries or initiates a new row.
  3. **Live Sync / Append**: When a technician clicks *Mark Stage Complete* or *Sign & Lock*, the app writes test measurements (optical power, extinction ratio, checklist statuses, technician ID, and timestamp) directly into designated columns in the `.xlsx` file on the network share.
  4. **Status Indicator**: An unobtrusive network connection badge shows the live status (`Connected to Z:\...`, `Syncing`, or `Offline Fallback`).

- **Visual Identity & Theme**:
  - Consistent with the clean industrial aesthetic of Digital Traveller (slate/zinc dark palette and high-contrast light mode `#f8fafc`).
  - Subtle network sync badge in the title bar or footer indicating spreadsheet sync status.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Native Desktop Wrapper (Electron) vs. Browser Sandbox**:
  - *Chosen Approach*: Electron wrapper with an IPC bridge (`preload.ts` + Node `fs`/`path`).
  - *Why*: Browsers intentionally sandbox web pages and forbid opening `\\server\share\...` or arbitrary file paths without repetitive "Open File" picker prompts on every single save. Electron provides true background read/write capabilities without interrupting the technician.
  - *Alternatives Considered*: Browser File System Access API (rejected because it cannot silently auto-save across sessions to remote network paths and requires repetitive user permission prompts).

- **Decision 2: In-Memory Excel Engine (`exceljs`) vs. CSV conversion**:
  - *Chosen Approach*: `exceljs` engine running inside the background desktop process.
  - *Why*: Supports rich formatting, multiple worksheets, cell styles, and formulas without altering non-traveller sheets or columns in company workbooks.
  - *Alternatives Considered*: Plain CSV (rejected because modern corporate logs use multi-tab `.xlsx` spreadsheets).

- **Decision 3: File Locking & Concurrency Protection**:
  - *Chosen Approach*: Atomic write with retry and backup lock checks. If another engineer has the workbook opened in Excel (creating an Excel lock), the app alerts the technician with a non-blocking toast, queues the update, or saves an incremental append without crashing.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Digital Traveller App                           │
│  (React + Tailwind UI: StepList, TechSelector, SystemSelector)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ IPC Invoke (saveRecord / loadSheet)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Electron Desktop Preload Bridge                     │
│               window.electronAPI.readExcel(path, query)                │
│               window.electronAPI.updateExcel(path, data)               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Node.js Native Runtime
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Network Drive File System (fs)                     │
│  ExcelJS Engine: Reads / Updates / Writes binary `.xlsx` files         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ UNC / SMB Protocol
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Company Network Share (e.g. \\server\qa\)                │
│  - Production_Travellers.xlsx                                          │
│  - System_Calibration_Logs.xlsx                                        │
└────────────────────────────────────────────────────────────────────────┘
```

- **Core Data Entities**:
  - `ExcelConfig`: Network path, target sheet name, key column mapping (Serial Number, Stage, Date, Tech, Results).
  - `SyncStatus`: `idle` | `reading` | `writing` | `locked_by_user` | `error`.
  - `TravellerRecord`: Full digital traveller model mapped to designated rows and cells.

- **Interactive Handlers & Execution Phases**:
  - **Phase A**: Add an `electron/` directory with `main.ts`, `preload.ts`, and packaging scripts (`electron-builder`) into `package.json` to produce a single-click Windows `.exe`.
  - **Phase B**: Implement `SpreadsheetService` to handle parsing and updating `.xlsx` files with `exceljs`.
  - **Phase C**: Add Admin Settings panel for configuring network spreadsheet paths and column mappings.
