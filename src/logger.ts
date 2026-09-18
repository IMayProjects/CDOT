export const MasterLogSheetName = "master_log";
import { PreferencesService, PreferenceKeys } from "./Config";

export enum LogLevel {
  INFO1 = "Info1",
  INFO2 = "Info2",
  WARN = "Warn",
  ERROR = "Error",
  FATAL = "Fatal",
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.INFO1]: 1,
  [LogLevel.INFO2]: 2,
  [LogLevel.WARN]: 3,
  [LogLevel.ERROR]: 4,
  [LogLevel.FATAL]: 5,
};

export class AppLogger {
  private static readonly MAX_STACK_LINES = 20;
  private static readonly MAX_STACK_LENGTH = 8000;
  private static getSheet(): GoogleAppsScript.Spreadsheet.Sheet | null {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) return null;

    let sheet = spreadsheet.getSheetByName(MasterLogSheetName);
    // If the sheet doesn't exist, create it and add headers
    if (!sheet) {
      sheet = spreadsheet.insertSheet(MasterLogSheetName);
      sheet.appendRow(["Timestamp", "Level", "Message", "Stack Trace"]);
    }
    return sheet;
  }

  private static log(level: LogLevel, message: string, error?: any) {
    const configured = PreferencesService.getInstance().getPreference(PreferenceKeys.LOG_LEVEL) || LogLevel.INFO1;
    const threshold = LOG_LEVEL_PRIORITY[configured as LogLevel] || LOG_LEVEL_PRIORITY[LogLevel.INFO1];
    if (LOG_LEVEL_PRIORITY[level] < threshold) return;
    const sheet = this.getSheet();
    if (!sheet) return;

    // Human readable timestamp
    const timestamp = new Date().toLocaleString();
    let stackTrace = "";

    if (error && error.stack) {
      // Abbreviated stack trace (first 3 lines)
      stackTrace = String(error.stack)
        .split("\n")
        .slice(0, this.MAX_STACK_LINES)
        .join("\n");
    } else if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      // Generate a stack trace if none provided for errors
      const stack = new Error().stack;
      if (stack) {
        stackTrace = stack
          .split("\n")
          .slice(2, 2 + this.MAX_STACK_LINES)
          .join("\n");
      }
    }

    if (stackTrace.length > this.MAX_STACK_LENGTH) {
      stackTrace = `${stackTrace.slice(0, this.MAX_STACK_LENGTH)}\n...[truncated]`;
    }

    // Also write to standard Apps Script Logger for convenience
    Logger.log(`[${level}] ${message} ${stackTrace}`);

    try {
      sheet.appendRow([timestamp, level, message, stackTrace]);
    } catch (e) {
      Logger.log(`Failed to write to master log: ${e}`);
    }
  }

  public static info1(message: string) {
    this.log(LogLevel.INFO1, message);
  }

  public static info2(message: string) {
    this.log(LogLevel.INFO2, message);
  }

  public static warn(message: string) {
    this.log(LogLevel.WARN, message);
  }

  public static error(message: string, error?: any) {
    this.log(LogLevel.ERROR, message, error);
  }

  public static fatal(message: string, error?: any) {
    this.log(LogLevel.FATAL, message, error);
  }
}
