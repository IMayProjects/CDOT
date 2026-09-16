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

  getAllRecords(): DeviceRecord[] {
    return this.repo.getAllRecords();
  }

  getRecordsBySchool(emisNumbers: string[]): DeviceRecord[] {
    const records = this.repo
      .getAllRecords()
      .filter((rec) => emisNumbers.includes(rec.emisNumber));
    return records;
  }

  getRecordsBySerialNumber(serialNumbers: string[]): DeviceRecord[] {
    const records = this.repo
      .getAllRecords()
      .filter((rec) => serialNumbers.includes(rec.serialNumber));
    return records;
  }

  getRecordsByEmisNumber(emisNumbers: string[]) {
    const records = this.repo
      .getAllRecords()
      .filter((rec) => emisNumbers.includes(rec.emisNumber));

    return records;
  }

  getRecordsByDeviceIds(deviceIds: string[]) {
    const records = this.repo
      .getAllRecords()
      .filter((rec) => deviceIds.includes(rec.deviceId));
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
