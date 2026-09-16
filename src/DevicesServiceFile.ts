import { DeviceRepository } from "./DeviceReposirotyFile";
import { Globals } from "./globals";
import {
  DeviceRecordsSheetName,
  DeviceRecord,
  DeviceRecordsSheetColumn,
  DeviceRecordsTitleRow,
} from "./DeviceRecordFile";

export class DevicesService {
  private repo: DeviceRepository;
  private static instance: DevicesService;

  private constructor() {
    this.repo = DeviceRepository.getInstance();
  }

  public static getInstance(): DevicesService {
    if (!this.instance) {
      this.instance = new DevicesService();
    }
    return this.instance;
  }

  /**
   * Fetches a ChromeOS device by device ID.
   */
  getDeviceByDeviceId(
    device_id: string,
    customer_id: string = Globals.retrieveCustomerId(),
  ): GoogleAppsScript.AdminDirectory.Schema.ChromeOsDevice {
    return AdminDirectory.Chromeosdevices.get(customer_id, device_id);
  }

  getRecordsBySchool(eminsNumbers: string[]) {}

  getRecordsBySerialNumber(serialNumbers: string[]): DeviceRecord[] {
    const values = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(DeviceRecordsSheetName)
      .getDataRange()
      .getValues()
      .slice(DeviceRecordsTitleRow)
      .filter((rec) =>
        serialNumbers.includes(rec[DeviceRecordsSheetColumn.SERIAL_NUMBER]),
      );

    let records = values.map((row) => {
      return {
        serialNumber: row[DeviceRecordsSheetColumn.SERIAL_NUMBER],
        emisNumber: row[DeviceRecordsSheetColumn.EMIS_NUMBER],
        schoolName: row[DeviceRecordsSheetColumn.SCHOOL_NAME],
        district: row[DeviceRecordsSheetColumn.DISTRICT],
        deviceId: row[DeviceRecordsSheetColumn.DEVICE_ID],
        currentOrgUnitPath: row[DeviceRecordsSheetColumn.CURRENT_OU_PATH],
        targetOrgUnitPath: row[DeviceRecordsSheetColumn.TARGET_OU_PATH],
        isSample: row[DeviceRecordsSheetColumn.IS_SAMPLE],
      };
    });
    return records;
  }

  getRecordsByEmisNumber(emisNumbers: string[]) {
    const values = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(DeviceRecordsSheetName)
      .getDataRange()
      .getValues()
      .filter((row) =>
        emisNumbers.includes(String(row[DeviceRecordsSheetColumn.EMIS_NUMBER])),
      );

    let records = values.slice(DeviceRecordsTitleRow).map((row) => {
      return {
        serialNumber: row[DeviceRecordsSheetColumn.SERIAL_NUMBER],
        emisNumber: row[DeviceRecordsSheetColumn.EMIS_NUMBER],
        schoolName: row[DeviceRecordsSheetColumn.SCHOOL_NAME],
        district: row[DeviceRecordsSheetColumn.DISTRICT],
        deviceId: row[DeviceRecordsSheetColumn.DEVICE_ID],
        currentOrgUnitPath: row[DeviceRecordsSheetColumn.CURRENT_OU_PATH],
        targetOrgUnitPath: row[DeviceRecordsSheetColumn.TARGET_OU_PATH],
        isSample: row[DeviceRecordsSheetColumn.IS_SAMPLE],
      };
    });
    return records;
  }
  /**
   * Moves a ChromeOS device to another organizational unit by its device ID.
   */
  moveDeviceToOrgUnit(
    device_id: string,
    org_unit_path: string,
    customer_id: string = Globals.retrieveCustomerId(),
  ): GoogleAppsScript.AdminDirectory.Schema.ChromeOsDevice {
    return AdminDirectory.Chromeosdevices.update(
      { orgUnitPath: org_unit_path },
      customer_id,
      device_id,
    );
  }
}
