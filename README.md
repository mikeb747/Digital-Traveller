# Digital Traveller — Production QA & Calibration Workflow App

A modern, high-precision digital traveller and quality tracking system designed for Renishaw spectroscopy manufacturing workflows (**inVia**, **Virsa**, **inLux**).

---

## 🚀 Running on Your Work PC

### Option 1: Standalone Windows App (`.exe`) — No Node.js Required (Recommended for Network Test PCs)
You **do not** need Node.js or any developer tools installed on your test PC. 

#### Method A: Download directly from GitHub Actions (Latest Automated Build)
1. Go to your repository on GitHub: `https://github.com/<your-username>/digital-traveller`
2. Click on the **Actions** tab at the top.
3. In the left sidebar, click **Build Windows Standalone Executable**.
4. Click on the latest workflow run (or click **Run workflow** $\to$ **Run workflow** to generate a fresh one anytime).
5. Once complete (green checkmark), scroll down to the **Artifacts** section at the bottom of the page.
6. Click **`digital-traveller-windows`** to download the zip file.
7. Unzip the file on your test PC. You will find:
   - **`Digital Traveller <version>.exe`** (Installer)
   - **`Digital Traveller <version>-portable.exe`** (Portable single-file executable — run directly with zero installation)
8. Double-click the `.exe` to run! It runs completely self-contained and natively executes background WiRE Key requests with Windows domain authentication.

#### Method B: Releases (Tag-based)
Whenever a version tag (e.g. `v1.006`) is pushed, GitHub Actions automatically compiles the `.exe` and attaches both the setup installer and the portable executable under **Releases** on GitHub.

---

### Option 2: Browser PWA (Instant, No Installation Required)
Open your shared cloud deployment link in Chrome or Microsoft Edge:
- In the URL bar, click the **Install App** icon (or Menu $\to$ **Install Digital Traveller**).
- It will run in its own standalone, frameless desktop window with local storage persistence.

---

### Option 3: Running from Source / Local Developer Mode
If you already have **Node.js** (v18+) installed on your PC:
1. Open a Command Prompt / PowerShell in the extracted project folder:
   ```bash
   npm install
   npm run dev
   ```
2. Open `http://localhost:3000` in your browser.
3. To package the desktop app locally:
   ```bash
   npm run electron:build
   ```
   The `.exe` will be generated in the `release/` folder.

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

---

## 🐛 Known Issues & Bug Tracker

| ID | Module | Issue | Status | Details |
|---|---|---|---|---|
| **BUG-001** | `WiRE Key Generator` | **Offline algorithm generates mismatched key** | **Logged / Pending Future Fix** | The client-side offline deterministic hash generator produces a key format that does not match the internal Renishaw proprietary encryption/hash used on `https://spd-apps/FeaturePermissions/generate`. Leave code intact as placeholder for when algorithm specs are provided. |
| **NOTE-001** | `WiRE Key / spd-apps` | **Initial POST redirects to dashboard (Session init)** | **By Design (IIS Windows Auth)** | `https://spd-apps` uses Windows Integrated Authentication (NTLM/Kerberos). On first contact, the server establishes the authenticated session cookie via `/dashboard`. On the second click, the session cookie is transmitted and the key is displayed immediately. |
| **NOTE-002** | `WiRE Key / spd-apps` | **HTTP 401.2 Unauthorized in InPrivate/Incognito mode** | **By Design (IIS Windows Auth)** | HTTP 401.2 indicates IIS Windows Integrated Authentication is rejected because InPrivate/Incognito browsing mode prevents automatic pass-through of your Windows domain login credentials (`RENA\...`). Regular browser mode is required to pass domain credentials to internal intranet servers. |
