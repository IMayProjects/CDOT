import {
  DeviceRecord,
  DeviceRecordsSheetName,
  DeviceRecordsSheetColumn,
  DeviceRecordsTitleRow,
  AcDevicesSheetName,
  AcDevicesColumn,
  ProcessorRecordsSheetName,
} from "./DeviceRecordFile";

export class DeviceRepository {
  private static instance: DeviceRepository;

  private constructor() {}

  public static getInstance(): DeviceRepository {
    if (!DeviceRepository.instance) {
      DeviceRepository.instance = new DeviceRepository();
    }
    return DeviceRepository.instance;
  }

  private getRecordsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      DeviceRecordsSheetName,
    );
    if (!sheet) {
      throw new Error(`Sheet ${DeviceRecordsSheetName} not found.`);
    }
    return sheet;
  }
  private getAcSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AcDevicesSheetName);
    if (!sheet) {
      throw new Error(`Sheet ${AcDevicesSheetName} not found.`);
    }
    return sheet;
  }
  private getProcessorRecordsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      ProcessorRecordsSheetName,
    );
    if (!sheet) {
      throw new Error(`Sheet ${ProcessorRecordsSheetName} not found.`);
    }
    return sheet;
  }

  getAllProcessorRecords(): DeviceRecord[] {
    const sheet = this.getProcessorRecordsSheet();
    const data = sheet.getDataRange().getValues();
    const records: DeviceRecord[] = [];

    for (let i = DeviceRecordsTitleRow; i < data.length; i++) {
      const row = data[i];
      // Skip empty rows
      if (
        !row[DeviceRecordsSheetColumn.SERIAL_NUMBER] &&
        !row[DeviceRecordsSheetColumn.DEVICE_ID]
      ) {
        continue;
      }
      records.push({
        serialNumber: String(row[DeviceRecordsSheetColumn.SERIAL_NUMBER] || ""),
        emisNumber: String(row[DeviceRecordsSheetColumn.EMIS_NUMBER] || ""),
        schoolName: String(row[DeviceRecordsSheetColumn.SCHOOL_NAME] || ""),
        district: String(row[DeviceRecordsSheetColumn.DISTRICT] || ""),
        deviceId: String(row[DeviceRecordsSheetColumn.DEVICE_ID] || ""),
        currentOrgUnitPath: String(
          row[DeviceRecordsSheetColumn.CURRENT_OU_PATH] || "",
        ),
        targetOrgUnitPath: String(
          row[DeviceRecordsSheetColumn.TARGET_OU_PATH] || "",
        ),
        isSample: Boolean(row[DeviceRecordsSheetColumn.IS_SAMPLE] == "1"),
      });
    }
    return records;
  }
  /**
   * Retrieves all device records from the spreadsheet.
   */
  getAllRecords(): DeviceRecord[] {
    const sheet = this.getRecordsSheet();
    const data = sheet.getDataRange().getValues();
    const records: DeviceRecord[] = [];

    for (let i = DeviceRecordsTitleRow; i < data.length; i++) {
      const row = data[i];
      // Skip empty rows
      if (
        !row[DeviceRecordsSheetColumn.SERIAL_NUMBER] &&
        !row[DeviceRecordsSheetColumn.DEVICE_ID]
      ) {
        continue;
      }
      records.push({
        serialNumber: String(row[DeviceRecordsSheetColumn.SERIAL_NUMBER] || ""),
        emisNumber: String(row[DeviceRecordsSheetColumn.EMIS_NUMBER] || ""),
        schoolName: String(row[DeviceRecordsSheetColumn.SCHOOL_NAME] || ""),
        district: String(row[DeviceRecordsSheetColumn.DISTRICT] || ""),
        deviceId: String(row[DeviceRecordsSheetColumn.DEVICE_ID] || ""),
        currentOrgUnitPath: String(
          row[DeviceRecordsSheetColumn.CURRENT_OU_PATH] || "",
        ),
        targetOrgUnitPath: String(
          row[DeviceRecordsSheetColumn.TARGET_OU_PATH] || "",
        ),
        isSample: Boolean(row[DeviceRecordsSheetColumn.IS_SAMPLE] == "1"),
      });
    }
    return records;
  }

  updateCurrentOU(serialNumber: string, orgUnitPath: string) {
    const sheet = this.getAcSheet();
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][AcDevicesColumn.SERIAL_NUMBER] === serialNumber) {
        sheet
          .getRange(i + 1, AcDevicesColumn.CURRENT_OU_PATH + 1)
          .setValue(orgUnitPath);
        break;
      }
    }
  }

  setDeviceTargetOU(serialNumber: string, orgUnitPath: string) {
    this.setDeviceTargetOUs([serialNumber], orgUnitPath);
  }

  setDeviceTargetOUs(serialNumbers: string[], orgUnitPath: string) {
    if (serialNumbers.length === 0) return;
    const sheet = this.getAcSheet();
    const data = sheet.getDataRange().getValues();
    const serialSet = new Set(serialNumbers);

    // Instead of doing multiple setValue calls which is slow, we can collect updates
    // But for a simple script, doing a few setValue is fine, or setting a range if they are contiguous.
    // Let's just loop and setValue for simplicity, but avoid searching from the start every time.
    for (let i = 1; i < data.length; i++) {
      if (serialSet.has(data[i][AcDevicesColumn.SERIAL_NUMBER])) {
        sheet
          .getRange(i + 1, AcDevicesColumn.TARGET_OU_PATH + 1)
          .setValue(orgUnitPath);
        serialSet.delete(data[i][AcDevicesColumn.SERIAL_NUMBER]);
        if (serialSet.size === 0) break;
      }
    }
  }
  setPilotStatus(serialNumbers: string[], status: boolean) {
    if (serialNumbers.length === 0) return;
    const acSheet = this.getAcSheet();
    const data = acSheet.getDataRange().getValues();
    const serialSet = new Set(serialNumbers);
    const value = status ? 1 : 0;

    for (let i = 1; i < data.length; i++) {
      if (serialSet.has(data[i][AcDevicesColumn.SERIAL_NUMBER])) {
        acSheet.getRange(i + 1, AcDevicesColumn.IS_SAMPLE + 1).setValue(value);
        serialSet.delete(data[i][AcDevicesColumn.SERIAL_NUMBER]);
        if (serialSet.size === 0) break;
      }
    }
  }
  enablePilotDeployment(serialNumber: string) {
    this.setPilotStatus([serialNumber], true);
  }
  disablePilotDeployment(serialNumber: string) {
    this.setPilotStatus([serialNumber], false);
  }
}
