# CDOT Device Migration Console

CDOT is a Google Apps Script sidebar and batch processor for managing ChromeOS devices and moving them between Google Admin organizational units (OUs).

It combines spreadsheet-backed records with the Admin Directory advanced service. Operators can review schools and devices, toggle pilot status, stage target OUs, migrate individual devices, run school-level bulk actions, and recover missing OUs after a failed migration.

## Features

- School directory loaded directly from the `schools` sheet.
- Device search and filtering by serial number, EMIS number, district, and pilot status.
- School filters for pilot status, district, and EMIS number.
- Automatic target-OU suggestions based on district, EMIS number, and pilot status.
- Explicit Stage and Rush workflow:
  - **Stage** writes the suggested target OU to the cache.
  - **Rush** reads the persisted target, moves the device through Admin Directory, verifies the result, and updates the cached current OU.
- Individual and school-wide pilot toggles.
- School-level bulk Stage and Rush operations.
- Unregistered devices remain visible but cannot be staged or migrated when no Admin Console `deviceId` exists.
- Failed migrations expose OU recovery, which creates only missing OU segments beneath `/Chromebooks`.
- Clickable Current and Target OU paths copy to the clipboard.
- Interactive button states show progress, success, partial completion, failure, and retry availability.
- Configurable structured logging to the `master_log` sheet and Apps Script logs.

## Data sources

The bound spreadsheet should contain these sheets:

| Sheet | Purpose |
| --- | --- |
| `schools` | Authoritative EMIS, school name, district, and school pilot flag. |
| `device_records` | Device records used by the sidebar, including registered and unregistered devices. |
| `filtered_device_records` | Processor input for batch migration. |
| `admin_console_device_cache` | Current OU, staged target OU, pilot state, serial number, and device ID cache. |
| `master_log` | Created automatically for application and UI operation logs. |

EMIS numbers must be stored as text consistently across the relevant sheets. Mixed text/number types can cause exact spreadsheet lookups to return `#N/A`.

## Workflow

1. Use the Schools or Devices tab to find the relevant record.
2. Toggle pilot status if required.
3. Click **Stage** to calculate and persist the target OU in `admin_console_device_cache`.
4. Confirm the device shows a Pending state.
5. Click **Rush** to perform the Admin Directory move.
6. The verified Admin Directory OU is written back as the cached current OU.

If Rush fails because an OU is missing, click **Create missing OUs**. Recovery checks each cumulative path segment beneath `/Chromebooks`, skips existing units, and creates missing descendants in order. Recovery does not retry the device migration automatically; run Rush again after recovery succeeds.

## Architecture

```text
UI.html
  -> UI.ts Apps Script handlers
      -> DevicesService
          -> DeviceRepository / Sheets
          -> Admin Directory API
```

`Queries.ts` contains pure device filtering/grouping logic. `organizational_units.ts` contains target-OU parsing. `AppLogger` centralizes logging and honors the configured logging threshold.

## Requirements

- Google Workspace administrator access sufficient to manage ChromeOS devices and organizational units.
- A spreadsheet-bound Apps Script project.
- Admin Directory API enabled as an advanced Google service.
- Script Property `CustomerID` set to the Workspace customer ID (usually `my_customer`).
- Spreadsheet access to all sheets listed above.

## Local development

Install dependencies and validate the project:

```powershell
npm install
npx.cmd tsc --noEmit
npm.cmd run build
```

The build produces deployable Apps Script files in `dist/`. It bundles the Core and UI entry points and copies `UI.html` and `appsscript.json`.

Deploy with clasp:

```powershell
npm.cmd run push
```

Preview the sidebar locally:

```powershell
npm.cmd run serve
```

## Deployment entry points

- `dist/core.js`: batch migration trigger and processor.
- `dist/ui.js`: sidebar server handlers.
- `dist/UI.html`: sidebar client interface.
- `dist/appsscript.json`: Apps Script manifest.

The build script explicitly exposes Apps Script global handlers. When adding a new UI server function, add it to the UI handler list in `scripts/build.js`.

## Logging

Logs are written to the `master_log` sheet and the Apps Script execution log. The Settings view controls the minimum level:

- Verbose (`Info1`)
- Standard (`Info2`)
- Warnings
- Errors
- Fatal only

Error traces retain up to 20 stack lines and 8,000 characters. UI success and failure callbacks also record operation outcomes.

## Historical work log

Development milestones and detailed implementation notes are preserved in [WORK_LOG.md](WORK_LOG.md).
