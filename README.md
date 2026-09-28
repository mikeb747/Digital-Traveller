# Digital Traveller — Production QA & Calibration Workflow App

A modern, high-precision digital traveller and quality tracking system designed for Renishaw spectroscopy manufacturing workflows (**inVia**, **Virsa**, **inLux**).

---

## 🚀 Running on Your Work PC

### Option 1: Browser PWA (Instant, No Installation Required)
Open your shared cloud deployment link in Chrome or Microsoft Edge:
- In the URL bar, click the **Install App** icon (or Menu $\to$ **Install Digital Traveller**).
- It will run in its own standalone, frameless desktop window with local storage persistence.

---

### Option 2: Running from Source (via GitHub)
1. Ensure **Node.js** (v18 or higher) is installed on your PC.
2. Clone or download this repository.
3. Open a Command Prompt / PowerShell in the folder:
   ```bash
   npm install
   npm run dev
   ```
4. Open `http://localhost:3000` in your browser.

---

### Option 3: Building a Standalone Windows Desktop App (`.exe`)
The repository includes an Electron desktop wrapper designed to provide direct operating system file access:

1. In the project folder, build the production web bundle:
   ```bash
   npm run build
   ```
2. Build the Windows installer/portable `.exe`:
   ```bash
   npx electron-builder --win
   ```
3. The executable will be generated inside the `dist/` or `release/` folder.

---

## 📊 Network Share & Excel (`.xlsx`) Integration

The application features a built-in **Excel Hub** (accessed via the top title bar button **`📊 Excel Hub`**):

### Features:
- **Direct Multi-Sheet Excel Export**: Generates `.xlsx` files with sheets for:
  - **Overview**: System model, S/N, Work Order, Customer, Job, and Part Number.
  - **Workflow Steps**: Full procedure names, statuses, assigned technician, timestamps, and notes.
  - **Measurements**: Recorded laser powers, tolerances, wavelength checks, and pass/fail statuses.
  - **Checklists**: Quality checklist verification items.
  - **Audit Log**: Complete chronological event history.
- **Bi-Directional Synchronization**: Load an existing or edited `.xlsx` file from your network share (`\\nas-prod\Renishaw\...` or mapped drive `Z:\...`) to automatically sync test results and step completions back into the digital traveller.
- **Desktop File System Privileges**: When compiled as an Electron executable, it can directly read and write files over your local network share without browser prompt dialogs.
