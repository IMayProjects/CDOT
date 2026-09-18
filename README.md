# CDOT Device Migration Apps Script — Evolution Log

This document records how the project has evolved, the state reached at each milestone, and the decisions that shaped the current implementation. Update the newest entry whenever a meaningful capability, architecture, or deployment decision changes.

## Current Snapshot

The project is a spreadsheet-bound Google Apps Script for migrating managed ChromeOS devices between Google Admin organizational units (OUs). It reads device data from Sheets, calls the Advanced Admin Directory service, records migration activity, and includes the beginning of a spreadsheet sidebar interface.

The current deployment is generated from explicit source groups:

| Source group | Deployment artifact | Current responsibility |
| --- | --- | --- |
| Core | `dist/core.js` | Device migration and the `runDeviceMigration` trigger handler. |
| UI server | `dist/ui.js` | Spreadsheet menu, sidebar launcher, configuration API, and device query API. |
| UI client | `dist/UI.html` | Sidebar markup, styles, and browser-side interaction. |
| Manifest | `dist/appsscript.json` | Apps Script runtime and Advanced Admin service configuration. |

## Timeline

### 2026-09-18 20:13:24 SAST — OU recovery, path handling, diagnostics, and interactive controls

- Added OU recovery after a failed migration. Recovery walks the target path segment by segment beneath `/Chromebooks`, checks each exact OU before creation, and creates only missing descendants.
- OU lookups use slash-delimited paths without a leading slash, while `parentOrgUnitPath` uses the required leading slash. OU matching preserves case while normalizing redundant slashes and surrounding whitespace.
- Missing EMIS OUs receive the school name as their description; other OU levels do not.
- Expanded error logging to retain up to 20 stack lines and 8,000 characters, and added detailed recovery context to `master_log`.
- Added retryable action states for device and school Pilot, Stage, Rush, migration, and OU recovery controls.
- Current and Target OU values on device cards can be clicked to copy their paths to the clipboard.

**Why it matters:** Failed migrations can now be recovered without blindly recreating existing OUs, while the sidebar clearly communicates operation state and preserves enough diagnostic context to troubleshoot Admin Directory errors.

### 2026-09-18 14:06:54 SAST — Direct school records, staged migrations, bulk actions, and registration safeguards

- The Schools tab now reads school identity and pilot flags directly from the `schools` sheet through `SchoolRecord` and `DeviceRepository`, rather than deriving the school list only from device records.
- `SchoolDevicesRecord` groups each `SchoolRecord` with its matching `DeviceRecord[]` devices.
- Added Schools-tab filters for pilot status, district, and EMIS number.
- Centralized UI and processor data operations behind `DevicesService`, including pilot changes, processor records, cache updates, and target-OU enrichment.
- Renamed the cache sheet integration from `ac_devices` to `admin_console_device_cache` and synchronized the cache after sidebar migrations.
- Added separate **Stage** and **Rush** actions for devices and schools. Stage persists the deterministic `parseTargetOrgUnit` suggestion to `admin_console_device_cache`; Rush reloads the staged target, performs the Admin Directory move, verifies it, and updates the cache current OU from the verified device.
- Added bulk school Stage/Rush actions. Unregistered devices are skipped during bulk transactions.
- Devices without a `deviceId` remain visible and are marked **Unregistered**, but cannot be staged or rushed.
- Added service- and UI-level operational logging through `AppLogger` to the `master_log` sheet and Apps Script execution log.
- Reworked device and school card actions into dedicated rows so controls no longer compress or overflow card content.

**Why it matters:** School management now reflects the authoritative school sheet, target OU changes are explicit and auditable before migration, and incomplete/unregistered records cannot be sent to the Admin Directory API.

### 2026-09-17 — Build handler fix, layout fix, OU casing utility, and codebase audit

- Fixed `scripts/build.js` to expose `migrateDeviceToTarget`, `toggleDevicePilotStatus`, and `toggleSchoolPilotStatus` as global Apps Script handlers. These were missing from the `handlers` array, causing the sidebar buttons to silently fail.
- Fixed device card layout overflow by adding `flex-wrap: wrap` to `.device-ou-row` so the Pilot and Migrate buttons no longer obscure the OU path text.
- Added `toTitleCase(str)` utility to `organizational_units.ts` for normalizing district name casing when building OU paths.
- Conducted a full codebase audit (see `.agent-artifacts/codebase-review.md`) identifying duplicated responsibilities and misdirected dependencies:
  - `UI.ts` bypasses `DevicesService` and calls `DeviceRepository` directly for pilot status changes.
  - `migrateDeviceToTarget` (UI path) does not update the `ac_devices` sheet after a successful move, unlike the batch processor — breaking the circular data loop.
  - `getAllProcessorRecords` and `getAllRecords` in `DeviceRepository` are copy-pasted (30 identical lines of row→record mapping).
  - `getRecordsBySchool` is dead code duplicating `getRecordsByEmisNumber`.
  - `enablePilotDeployment`/`disablePilotDeployment` are now dead wrappers around `setPilotStatus`.

**Why it matters:** The sidebar buttons were non-functional in production because the build step didn't expose them. The audit identified that the UI migration path silently skips the `ac_devices` update, causing stale data in the circular data loop.

### 2026-09-17 — Automatic Target OU Generation and Batch Pilot Status Controls

- Made `parseTargetOrgUnit` the singular decider for a device's target OU path. The target OU path is now dynamically computed in `searchDevices` on the backend, meaning the UI automatically suggests and defaults to the correct target OU without requiring any manual text input or dropdown selection from the user.
- Added individual **Set Pilot / Un-Pilot** toggles on device cards.
- Added batch **Set Pilot / Un-Pilot** toggles on school cards to affect all devices within that school's `emisNumber`.
- Verified and documented the circular data loop architecture: The pilot toggles write directly to the `ac_devices` sheet, which in turn feeds into `device_records` via a formula. The UI automatically displays the newly generated target OU as a result of this data propagation.

**Why it matters:** The operator no longer needs to manually construct or paste OU paths. Target OUs are deterministically and automatically generated based on the district, EMIS number, and pilot status. Managing the pilot rollout is as simple as flipping a switch in the sidebar for either an individual device or an entire school.

### 2026-09-17 — UI redesign, per-device migration, and dev preview

- Rebuilt `UI.html` with a modern Vercel/v0-grade dark theme: zinc color palette, subtle glassmorphic modals with backdrop blur, custom toggle switches, shimmer loading skeletons, and toast notifications.
- Added per-device OU migration from the sidebar. Each device card shows Current and Target OU paths with a `Synced` or `Pending` badge. Pending devices expose a **Migrate** button with animated states (idle → spinning → success/error).
- Added `migrateDeviceToTarget` server-side endpoint in `UI.ts`, reusing `DevicesService.moveDeviceToOrgUnit` with post-move verification.
- Added school → device cross-navigation: clicking **View** on a school card switches to the Devices tab and auto-applies an EMIS number filter for that school.
- Tab bar now shows icons and live count badges for schools and devices.
- Filter pill button highlights when filters are active.
- Added `scripts/serve.js` — a Node HTTP server for local UI preview (`npm run serve` at `localhost:3000`).

**Why it matters:** The sidebar is now production-grade in look and feel, and operators can migrate individual devices without running the full batch processor. The dev server enables rapid UI iteration without deploying to Apps Script.

### 2026-09-16 — UI refinements and robust configurations

- Introduced `PreferencesService` as the single source of truth for global preferences, completely replacing `ConfigService`.
- Converted `DistrictsDef` to a strict TypeScript `enum` for strong compile-time type safety.
- Upgraded the UI filter modal by replacing the district textarea with an interactive 2-column grid of checkboxes powered by `DistrictsDef`.
- Expanded `scripts/build.js` to correctly expose new backend endpoints like `getDistrictsDef` to the browser.
- Improved modal user experience with backdrop click-to-dismiss behavior.

**Why it matters:** User inputs for district filtering are now error-proof, and the backend configuration logic is cleaner, scalable, and strongly-typed.

### 2026-09-16 — Query-driven sidebar filtering

- Added `Queries.ts` as the single query layer for device-record filtering.
- Added a sidebar filter modal for serial numbers, EMIS numbers, districts, and sample status.
- Multiple values within the same field use OR logic; the persisted preference controls whether enabled fields combine with AND or OR.
- Added the `searchDevices` Apps Script endpoint for sidebar queries and a returned-record count in the sidebar.
- Scoped filters to the Devices tab and hid the unfinished OUs tab.
- Added a Schools tab backed by `SchoolRecord`, plus device grouping by school, district, or district→school.

**Why it matters:** The UI can now request predictable, user-driven subsets of device records without exposing raw query strings or applying temporary filters to the spreadsheet.

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
- A successful move is verified through a device lookup, then the corresponding `admin_console_device_cache` row is updated by serial number.
- `migrateDeviceToTarget` allows rushing a single staged device from the sidebar UI; it reloads the persisted target before calling Admin Directory.
- Target OUs are suggested by the deterministic `parseTargetOrgUnit` algorithm, then explicitly staged into `admin_console_device_cache` before migration.
- Pilot statuses can be toggled per-device or per-school. School pilot flags are written to `schools`, while matching device pilot values are maintained in `admin_console_device_cache`.
- The Schools tab reads `SchoolRecord` rows from `schools` and joins matching devices for counts, pilot display, and navigation.
- Records without a `deviceId` are treated as unregistered: they are visible for review but excluded from Stage and Rush transactions.
- Service and UI operations write structured events through `AppLogger` to `master_log`.
- OU recovery creates missing organizational units beneath `/Chromebooks` after a failed migration and leaves the migration itself failed until the operator retries it.
- Logging verbosity is configurable from Settings, from verbose events through fatal-only events.
- `onOpen` adds the **CDOT Management** menu; `showSidebar` opens `UI.html`.
- The sidebar uses `google.script.run` to read and save the `theme` preference.
- The sidebar filter modal queries device records by serial number, EMIS number, district, and sample status. Districts are selected via an interactive checkbox grid.
- Clicking **View** on a school card navigates to the Devices tab with an EMIS filter pre-applied.

## Required Environment

1. Bind the script to the spreadsheet containing `schools`, `device_records`, `filtered_device_records`, `admin_console_device_cache`, and `master_log` (the log sheet is created automatically if absent).
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

Preview the sidebar UI without deploying:

```powershell
npm run serve       # opens http://localhost:3000
```

`npm run build` clears and recreates `dist`. Add new server bundles to `bundles` in `scripts/build.js`; add HTML deployment files to `htmlAssets` in the same file.

## Next Log Entry Should Cover

- A dry-run mode, per-record migration status, retries, and reporting.
- Automated tests for sheet mapping, OU parsing, and continuation processing.
