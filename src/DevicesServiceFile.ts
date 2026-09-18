import { DeviceRepository } from "./DeviceReposirotyFile";
import { Globals } from "./globals";
import { DeviceRecord } from "./DeviceRecordFile";
import { SchoolRecord } from "./SchoolRecordFile";
import { parseTargetOrgUnit } from "./organizational_units";

/**
 * Service class for managing devices and school records.
 * Provides methods for fetching and updating device data.
 * Implements the Singleton pattern.
 */
export class DevicesService {
  /**
   * Repository for fetching device records.
   * @private
   */
  private repo: DeviceRepository;

  /**
   * Singleton instance of DevicesService.
   * @private
   */
  private static instance: DevicesService;

  /**
   * Private constructor to prevent direct instantiation.
   * Initializes the device repository.
   * @private
   */
  private constructor() {
    this.repo = DeviceRepository.getInstance();
  }

  /**
   * Gets the singleton instance of the DevicesService.
   * @returns {DevicesService} The singleton instance.
   */
  public static getInstance(): DevicesService {
    if (!this.instance) {
      this.instance = new DevicesService();
    }
    return this.instance;
  }

  /**
   * Fetches a ChromeOS device by its device ID.
   * @param {string} device_id - The unique identifier of the device.
   * @param {string} [customer_id=Globals.retrieveCustomerId()] - The customer ID. Defaults to the configured customer ID.
   * @returns {GoogleAppsScript.AdminDirectory.Schema.ChromeOsDevice} The ChromeOS device details.
   */
  getDeviceByDeviceId(
    device_id: string,
    customer_id: string = Globals.retrieveCustomerId(),
  ): GoogleAppsScript.AdminDirectory.Schema.ChromeOsDevice {
    return AdminDirectory.Chromeosdevices.get(customer_id, device_id);
  }

  /**
   * Retrieves all device records from the repository.
   * @returns {DeviceRecord[]} An array of all device records.
   */
  getAllRecords(): DeviceRecord[] {
    return this.repo.getAllRecords();
  }

  getProcessorRecords(): DeviceRecord[] {
    return this.repo.getAllProcessorRecords();
  }

  updateCurrentOrgUnit(serialNumber: string, orgUnitPath: string): void {
    this.repo.updateCurrentOU(serialNumber, orgUnitPath);
  }

  setDevicePilotStatus(serialNumber: string, status: boolean): void {
    this.repo.setPilotStatus([serialNumber], status);
  }

  setSchoolPilotStatus(emisNumber: string, status: boolean): number {
    const records = this.getRecordsByEmisNumber([emisNumber]);
    const serials = records.map((record) => record.serialNumber).filter(Boolean);
    this.repo.setPilotStatus(serials, status);
    return serials.length;
  }

  enrichRecordsWithTargetOU(records: DeviceRecord[]): DeviceRecord[] {
    return records.map((record) => ({
      ...record,
      targetOrgUnitPath: parseTargetOrgUnit(record),
    }));
  }

  /**
   * Retrieves school records grouped by EMIS numbers.
   * @param {string[]} emisNumbers - An array of EMIS numbers to fetch records for.
   * @returns {SchoolRecord[]} An array of school records, grouped by EMIS number.
   */
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

  /**
   * Retrieves device records filtered by a list of EMIS numbers (schools).
   * @param {string[]} emisNumbers - An array of EMIS numbers to filter by.
   * @returns {DeviceRecord[]} An array of device records matching the provided EMIS numbers.
   */
  getRecordsBySchool(emisNumbers: string[]): DeviceRecord[] {
    const records = this.repo
      .getAllRecords()
      .filter((rec) => emisNumbers.includes(rec.emisNumber));
    return records;
  }

  /**
   * Retrieves device records filtered by a list of serial numbers.
   * @param {string[]} serialNumbers - An array of serial numbers to filter by.
   * @returns {DeviceRecord[]} An array of device records matching the provided serial numbers.
   */
  getRecordsBySerialNumber(serialNumbers: string[]): DeviceRecord[] {
    const records = this.repo
      .getAllRecords()
      .filter((rec) => serialNumbers.includes(rec.serialNumber));
    return records;
  }

  /**
   * Retrieves device records filtered by a list of EMIS numbers.
   * @param {string[]} emisNumbers - An array of EMIS numbers to filter by.
   * @returns {DeviceRecord[]} An array of device records matching the provided EMIS numbers.
   */
  getRecordsByEmisNumber(emisNumbers: string[]) {
    const records = this.repo
      .getAllRecords()
      .filter((rec) => emisNumbers.includes(rec.emisNumber));

    return records;
  }

  /**
   * Retrieves device records filtered by a list of device IDs.
   * @param {string[]} deviceIds - An array of device IDs to filter by.
   * @returns {DeviceRecord[]} An array of device records matching the provided device IDs.
   */
  getRecordsByDeviceIds(deviceIds: string[]) {
    const records = this.repo
      .getAllRecords()
      .filter((rec) => deviceIds.includes(rec.deviceId));
    return records;
  }
  /**
   * Updates the target OU for a list of schools.
   * @param {string[]} emisNumbers - An array of EMIS numbers to update the target OU for.
   * @param {string} targetOU - The target organizational unit path.
   */
  setDeviceTargetOUs(device_ids: string[], targetOU: string) {
    this.repo.setDeviceTargetOUs(device_ids, targetOU);
  }

  /**
   * Moves a ChromeOS device to another organizational unit by its device ID.
   * @param {string} device_id - The unique identifier of the device.
   * @param {string} org_unit_path - The target organizational unit path.
   * @param {string} [customer_id=Globals.retrieveCustomerId()] - The customer ID. Defaults to the configured customer ID.
   * @returns {GoogleAppsScript.AdminDirectory.Schema.ChromeOsDevice} The updated ChromeOS device details.
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
