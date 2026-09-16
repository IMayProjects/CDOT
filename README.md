# CDOT Device Migration Apps Script — Evolution Log

This document records how the project has evolved, the state reached at each milestone, and the decisions that shaped the current implementation. Update the newest entry whenever a meaningful capability, architecture, or deployment decision changes.

## Current Snapshot

The project is a spreadsheet-bound Google Apps Script for migrating managed ChromeOS devices between Google Admin organizational units (OUs). It reads device data from Sheets, calls the Advanced Admin Directory service, records migration activity, and includes the beginning of a spreadsheet sidebar interface.

The current deployment is generated from explicit source groups:

| Source group | Deployment artifact | Current responsibility |
| --- | --- | --- |
| Core | `dist/core.js` | Device migration and the `runDeviceMigration` trigger handler. |
| UI server | `dist/ui.js` | Spreadsheet menu, sidebar launcher, and configuration API. |
| UI client | `dist/UI.html` | Sidebar markup, styles, and browser-side interaction. |
| Manifest | `dist/appsscript.json` | Apps Script runtime and Advanced Admin service configuration. |

## Timeline

### 2026-09-16 — Selective deployment bundles and sidebar assets

- Replaced the single-entry build with explicit `core.js` and `ui.js` bundles.
- Added a declared HTML asset list so `src/UI.html` is deployed as `dist/UI.html`.
- Exposed `runDeviceMigration`, `onOpen`, `showSidebar`, `getClientConfig`, and `saveClientConfig` as Apps Script global functions.
- Added the initial sidebar UI and a sheet-backed preferences service for the `theme` setting.

**Why it matters:** Apps Script cannot load ES modules directly. Explicit bundles make deployment boundaries visible and ensure server functions and HTML assets are intentionally included.

### 2026-09-16 — Migration hardening and operational logging

- Added `AppLogger`, which writes to both the Apps Script execution log and a `master_log` sheet created on demand.
- Added log levels for normal processing, warnings, and failures.
- Updated migration processing to read from `filtered_device_records`.
- Added a post-move Admin Directory lookup before recording a device's verified current OU in `ac_devices`.
- Added sticky-OU handling and target-OU parsing helpers for ChromeBook OU paths.

**Why it matters:** Migration activity is now observable, and sheet state is updated only after the remote OU change is verified.

### 2026-09-16 — Build automation

- Introduced a Node-based build step using `esbuild`.
- Added `npm run build` to create deployable output and `npm run push` to build before calling clasp.
- Moved clasp's deployment root to generated output rather than raw TypeScript sources.

**Why it matters:** TypeScript imports are bundled before deployment, avoiding the Apps Script `Cannot use import statement outside a module` failure.

### 2026-09-16 — Device records and migration processor

- Added sheet-backed device-record models and repository/service layers.
- Added filtering by EMIS number, serial number, and device ID.
- Added the batch migration processor with a Script Properties continuation token.
- Added time-based continuation triggers to stay within Apps Script execution limits.

**Why it matters:** The project moved from isolated script files to a repeatable, resumable migration workflow.

### 2026-09-14 — Apps Script and TypeScript configuration

- Configured the Apps Script manifest with the V8 runtime, Africa/Johannesburg timezone, and the Advanced Admin Directory service.
- Added TypeScript and Google Apps Script type definitions.
- Added clasp and Git ignore rules for local development artifacts.

**Why it matters:** This established the local TypeScript development environment and Google Workspace API integration.

### 2026-07-29 — Project initialization

- Created the initial CDOT Apps Script repository.

## Current Operational Behavior

- `runDeviceMigration` processes rows from `filtered_device_records` and stores progress under `DEVICE_MIGRATION_START_INDEX` in Script Properties.
- A run stops after about 4.5 minutes; remaining work schedules another run one minute later.
- Devices with differing current and target OUs are moved through the Admin Directory API.
- A successful move is verified through a device lookup, then the corresponding `ac_devices` row is updated by serial number.
- `onOpen` adds the **CDOT Management** menu; `showSidebar` opens `UI.html`.
- The sidebar uses `google.script.run` to read and save the `theme` preference.

## Required Environment

1. Bind the script to the spreadsheet containing `device_records`, `filtered_device_records`, and `ac_devices`.
2. Set the `CustomerID` Script Property for the target Google Workspace customer.
3. Enable the Advanced Google service **Admin Directory API**.
4. Use an executing account permitted to read the spreadsheet and manage ChromeOS devices.

## Working Locally

```powershell
npm install
npx.cmd tsc --noEmit
npm run build
npm run push
```

`npm run build` clears and recreates `dist`. Add new server bundles to `bundles` in `scripts/build.js`; add HTML deployment files to `htmlAssets` in the same file.

## Next Log Entry Should Cover

- The final relationship and validation rules between `filtered_device_records` and `ac_devices`.
- Whether target OUs are always precomputed in Sheets or derived during migration.
- A dry-run mode, per-record migration status, retries, and reporting.
- Automated tests for sheet mapping, OU parsing, and continuation processing.
