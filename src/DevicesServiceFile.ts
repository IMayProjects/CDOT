import { DeviceRepository } from "./DeviceReposirotyFile";
import { Globals } from "./globals";
import { DeviceRecord } from "./DeviceRecordFile";
import { SchoolRecord } from "./SchoolRecordFile";

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
  getSchoolRecords(emisNumbers: string[]): SchoolRecord[] {
    const trimmedEmis = Array.from(new Set(emisNumbers.map((e) => e.trim())));
    const allMatchingRecords = this.getRecordsByEmisNumber(trimmedEmis);

    const recordsByEmis: Record<string, DeviceRecord[]> = {};
    for (const record of allMatchingRecords) {
      if (!recordsByEmis[record.emisNumber]) {
        recordsByEmis[record.emisNumber] = [];
      }
      recordsByEmis[record.emisNumber].push(record);
    }

    return trimmedEmis.map((emis) => {
      const records = recordsByEmis[emis] || [];
      return {
        emis: emis,
        schoolName: records.length > 0 ? records[0].schoolName : "",
        district: records.length > 0 ? records[0].district : "",
        values: records,
      };
    });
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
