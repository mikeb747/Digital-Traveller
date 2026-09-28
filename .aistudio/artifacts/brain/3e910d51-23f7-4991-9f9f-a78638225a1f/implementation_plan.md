# Automated Windows Standalone Executable (.exe) via GitHub Actions

Deliver a ready-to-run Windows standalone executable (`.exe`) for Digital Traveller so test engineers on network PCs can run the desktop app with zero Node.js installation, zero terminal commands, and 100% background WiRE key retrieval.

### User Review & Critical Decisions

> [!IMPORTANT]
> The automated GitHub Actions workflow will produce two executable formats on every build:
> 1. **Portable `.exe` (`Digital Traveller <version>.exe`)**: Run directly without installing anything or needing admin rights on the test PC.
> 2. **Installer `.exe` (`Digital Traveller Setup <version>.exe`)**: Optional standard Windows installer with desktop shortcut.

- **Confirmed Decision**: Automated build via GitHub Actions so developers and testers never need Node.js, Git, or build tools installed on their local test PCs.
- **Workflow Triggers**: Triggerable on-demand via the **"Run workflow"** button in GitHub Actions, automatically on git tags (e.g. `v1.006`), and on pushes to `main`.

---

### 1. Overview & Core Concept

- **What It Does**: Automates the packaging of Digital Traveller and its Electron desktop wrapper in GitHub's cloud environment (`windows-latest`), generating downloadable Windows binaries (`.exe`).
- **Target Audience / Persona**: Quality engineers, test bench operators, and technicians running on restricted test PCs without Node.js or development environments.
- **Key Value**: Provides a double-clickable native Windows desktop app that leverages Windows Integrated Authentication (NTLM/Kerberos) to query `https://spd-apps/FeaturePermissions` off-screen, eliminating cross-origin browser restrictions and multi-click dashboard redirects.

---

### 2. User Experience & Workflow

```
┌─────────────────────────────────┐
│     GitHub Repository (Cloud)   │
│  - Push commit or click         │
│    "Run workflow" in Actions    │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   GitHub Actions Windows Runner │
│  - Sets up Node & dependencies  │
│  - Runs Vite production build   │
│  - Packages via electron-builder│
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Direct Download in GitHub UI   │
│  - Release Assets (.exe)        │
│  - Workflow Artifacts (zip)     │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│        Network Test PC          │
│  - Double-click .exe to open    │
│  - NO Node.js required!         │
│  - 1-click WiRE key background  │
│    fetch works out of the box   │
└─────────────────────────────────┘
```

#### Step-by-Step User Journey:
1. **Triggering the Build**: In your GitHub repository, open the **Actions** tab, select **Build Windows Executable**, and click **Run workflow**. (Or push a new version tag / commit).
2. **Downloading the Executable**: Once the ~3 minute build finishes, download the executable directly from the workflow's **Artifacts** section or the **Releases** page on GitHub.
3. **Running on Network PC**: Copy the `.exe` (via flash drive, network share, or browser download) to your test PC. Double-click to launch Digital Traveller immediately.

---

### 3. Key Product & Architecture Decisions

- **Dual Target Output (Portable + NSIS Installer)**:
  - *Chosen Approach*: Configure `electron-builder` to output both a standalone single-file portable `.exe` and an NSIS installer.
  - *Why*: Network test PCs often have restricted local user privileges where running a portable `.exe` avoids UAC prompts or installation permissions.
- **Dedicated GitHub Actions Workflow (`release-exe.yml`)**:
  - *Chosen Approach*: Separate from the GitHub Pages deployment workflow (`deploy.yml`).
  - *Why*: Keeps web app deployment fast (30 seconds on Linux) while running the Windows packaging on a native `windows-latest` runner with artifact retention.
- **Local Dev Script Preservation**:
  - *Chosen Approach*: Maintain `npm run electron:dev` and `npm run electron:build` in `package.json` so developers who *do* have Node.js can still run locally if desired.

---

### 4. Technical Architecture & Implementation Steps

```
📦 Repository Configuration
├── .github/workflows/
│   ├── deploy.yml            # (Existing) GitHub Pages web deployment
│   └── build-exe.yml         # (New) Automated Windows .exe build & release
├── package.json              # Configured electron-builder, targets, and scripts
└── electron/
    ├── main.cjs              # Electron main process with background NTLM fetch
    └── preload.cjs           # Secure IPC bridge for desktopAPI
```

#### Implementation Tasks:
1. **Configure `package.json`**:
   - Add `electron` and `electron-builder` to `devDependencies`.
   - Add `"electron:build": "npm run build && electron-builder --win"` script.
   - Configure `"build"` metadata: `appId`, `productName`, file include patterns (`dist/**/*`, `electron/**/*`), and Windows targets (`portable`, `nsis`).
2. **Create GitHub Actions Workflow (`.github/workflows/build-exe.yml`)**:
   - Platform: `windows-latest`.
   - Steps: Checkout, Node setup, dependency installation, Vite build, Electron packaging.
   - Outputs: Uploads executables to GitHub Actions artifacts and automatically attaches to GitHub Releases when a tag or dispatch is triggered.
3. **Documentation**:
   - Add clear 3-step instructions in `README.md` explaining how to download the `.exe` directly from GitHub Actions without installing Node.js.
