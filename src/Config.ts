export const ConfigSheetName = "config";

export enum DistrictsDef {
  ANE = "Alfred Nzo East",
  ANW = "Alfred Nzo West",
  AME = "Amathole East",
  AMW = "Amathole West",
  BCM = "Buffalo City",
  CHE = "Chris Hani East",
  CHW = "Chris Hani West",
  JG = "Joe Gqabi",
  NMB = "Nelson Mandela Bay",
  ORTC = "OR Tambo Coastal",
  ORTI = "OR Tambo Inland",
  SB = "Sarah Baartman",
}

export function getDistrictsDef() {
  return DistrictsDef;
}

export enum ConfigKeys {
  THEME = "theme",
  QUERY_JOIN_MODE = "queryJoinMode",
}

const DEFAULT_CONFIG: Record<string, string> = {
  [ConfigKeys.THEME]: "dark",
  [ConfigKeys.QUERY_JOIN_MODE]: "AND",
};

export class PreferencesService {
  private static instance: PreferencesService;

  private constructor() {}

  public static getInstance(): PreferencesService {
    if (!this.instance) {
      this.instance = new PreferencesService();
    }
    return this.instance;
  }

  private getSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    let sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ConfigSheetName);
    if (!sheet) {
      sheet =
        SpreadsheetApp.getActiveSpreadsheet().insertSheet(ConfigSheetName);
      sheet.appendRow(["Key", "Value"]);

      // Give the header some basic styling
      sheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#e0e0e0");
    }
    return sheet;
  }

  public getAllPreferences(): Record<string, string> {
    const sheet = this.getSheet();
    const data = sheet.getDataRange().getValues();
    const config: Record<string, string> = { ...DEFAULT_CONFIG };

    const foundKeys = new Set<string>();

    // Start from 1 to skip header row
    for (let i = 1; i < data.length; i++) {
      const key = String(data[i][0]).trim();
      const value = String(data[i][1]).trim();

      if (key && !foundKeys.has(key)) {
        config[key] = value;
        foundKeys.add(key);
      }
    }

    return config;
  }

  public getPreference(key: ConfigKeys): string {
    const config = this.getAllPreferences();
    return config[key];
  }

  public setPreference(key: ConfigKeys, value: string): void {
    const sheet = this.getSheet();
    const data = sheet.getDataRange().getValues();

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      const rowKey = String(data[i][0]).trim();
      if (rowKey === key) {
        rowIndex = i + 1; // Google Sheets API uses 1-based indexing
        break;
      }
    }

    if (rowIndex !== -1) {
      sheet.getRange(rowIndex, 2).setValue(value);
    } else {
      sheet.appendRow([key, value]);
    }
  }
}

// These functions act as an API for the HTML UI (via google.script.run)
export function getClientConfig() {
  return PreferencesService.getInstance().getAllPreferences();
}

export function saveClientConfig(key: ConfigKeys, value: string) {
  PreferencesService.getInstance().setPreference(key, value);
}
