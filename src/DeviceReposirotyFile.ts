import {
  DeviceRecord,
  DeviceRecordsSheetName,
  DeviceRecordsSheetColumn,
  DeviceRecordsTitleRow,
  AcDevicesSheetName,
  AcDevicesColumn,
} from "./DeviceRecordFile";

export class DeviceRepository {
  private deviceRecordsSheetName: string;
  private acDevicesSheetName: string;
  private static instance: DeviceRepository;

  private constructor() {
    this.deviceRecordsSheetName = DeviceRecordsSheetName;
    this.acDevicesSheetName = AcDevicesSheetName;
  }

  public static getInstance(): DeviceRepository {
    if (!DeviceRepository.instance) {
      DeviceRepository.instance = new DeviceRepository();
    }
    return DeviceRepository.instance;
  }

  private getRecordsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      this.deviceRecordsSheetName,
    );
    if (!sheet) {
      throw new Error(`Sheet ${this.deviceRecordsSheetName} not found.`);
    }
    return sheet;
  }
  private getAcSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      this.acDevicesSheetName,
    );
    if (!sheet) {
      throw new Error(`Sheet ${this.acDevicesSheetName} not found.`);
    }
    return sheet;
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
        isSample: Boolean(row[DeviceRecordsSheetColumn.IS_SAMPLE]),
      });
    }
    return records;
  }

  /**
   * Retrieves a device record by its serial number.
   */
  getRecordsBySerialNumber(serialNumbers: string[]): DeviceRecord[] | null {
    const records = this.getAllRecords();
    return (
      records.filter((r) => serialNumbers.includes(r.serialNumber)) || null
    );
  }

  /**
   * Retrieves a device record by its device ID.
   */
  getRecordsByDeviceId(deviceIds: string[]): DeviceRecord[] | null {
    const records = this.getAllRecords();
    return records.filter((r) => deviceIds.includes(r.deviceId)) || null;
  }

  enablePilotDeployment(serialNumber: string) {
    const acSheet = this.getAcSheet();
    const data = acSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][AcDevicesColumn.SERIAL_NUMBER] === serialNumber) {
        acSheet.getRange(i + 1, AcDevicesColumn.IS_SAMPLE + 1).setValue(1);
        break;
      }
    }
  }

  // /**
  //  * Adds a new device record to the spreadsheet.
  //  */
  // addRecord(record: MappedDeviceRecord): void {
  //   const sheet = this.getSheet();
  //   const row: any[] = [];
  //   row[MappedDevicesSheetColumn.EMIS_NUMBER] = record.emisNumber;
  //   row[MappedDevicesSheetColumn.SERIAL_NUMBER] = record.serialNumber;
  //   row[MappedDevicesSheetColumn.DEVICE_ID] = record.deviceId;
  //   row[MappedDevicesSheetColumn.SCHOOL_NAME] = record.schoolName;
  //   row[MappedDevicesSheetColumn.DISTRICT] = record.district;
  //   row[MappedDevicesSheetColumn.CURRENT_OU_PATH] = record.currentOrgUnitPath;
  //   row[MappedDevicesSheetColumn.TARGET_OU_PATH] = record.targetOrgUnitPath;
  //   sheet.appendRow(row);
  // }

  // /**
  //  * Updates an existing device record found by serial number.
  //  */
  // updateRecord(
  //   serialNumber: string,
  //   updatedRecord: Partial<MappedDeviceRecord>,
  // ): boolean {
  //   const sheet = this.getSheet();
  //   const data = sheet.getDataRange().getValues();

  //   for (let i = MappedDevicesTitleRow; i < data.length; i++) {
  //     if (
  //       String(data[i][MappedDevicesSheetColumn.SERIAL_NUMBER]) === serialNumber
  //     ) {
  //       const rowNum = i + 1; // Apps Script ranges are 1-indexed

  //       if (updatedRecord.emisNumber !== undefined) {
  //         sheet
  //           .getRange(rowNum, MappedDevicesSheetColumn.EMIS_NUMBER + 1)
  //           .setValue(updatedRecord.emisNumber);
  //       }
  //       if (updatedRecord.serialNumber !== undefined) {
  //         sheet
  //           .getRange(rowNum, MappedDevicesSheetColumn.SERIAL_NUMBER + 1)
  //           .setValue(updatedRecord.serialNumber);
  //       }
  //       if (updatedRecord.deviceId !== undefined) {
  //         sheet
  //           .getRange(rowNum, MappedDevicesSheetColumn.DEVICE_ID + 1)
  //           .setValue(updatedRecord.deviceId);
  //       }
  //       if (updatedRecord.schoolName !== undefined) {
  //         sheet
  //           .getRange(rowNum, MappedDevicesSheetColumn.SCHOOL_NAME + 1)
  //           .setValue(updatedRecord.schoolName);
  //       }
  //       if (updatedRecord.district !== undefined) {
  //         sheet
  //           .getRange(rowNum, MappedDevicesSheetColumn.DISTRICT + 1)
  //           .setValue(updatedRecord.district);
  //       }
  //       if (updatedRecord.currentOrgUnitPath !== undefined) {
  //         sheet
  //           .getRange(rowNum, MappedDevicesSheetColumn.CURRENT_OU_PATH + 1)
  //           .setValue(updatedRecord.currentOrgUnitPath);
  //       }
  //       if (updatedRecord.targetOrgUnitPath !== undefined) {
  //         sheet
  //           .getRange(rowNum, MappedDevicesSheetColumn.TARGET_OU_PATH + 1)
  //           .setValue(updatedRecord.targetOrgUnitPath);
  //       }
  //       return true; // Successfully updated
  //     }
  //   }
  //   return false; // Record not found
  // }
}
