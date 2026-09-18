import { DeviceRepository } from "./DeviceReposirotyFile";
import { Globals } from "./globals";
import { DeviceRecord } from "./DeviceRecordFile";
import { SchoolDevicesRecord } from "./SchoolRecordFile";
import { parseTargetOrgUnit } from "./organizational_units";
import { AppLogger } from "./logger";

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
    const records = this.repo.getAllRecords();
    AppLogger.info2(`Loaded ${records.length} device records`);
    return records;
  }

  getProcessorRecords(): DeviceRecord[] {
    return this.repo.getAllProcessorRecords();
  }

  updateCurrentOrgUnit(serialNumber: string, orgUnitPath: string): void {
    this.repo.updateCurrentOU(serialNumber, orgUnitPath);
  }

  setDevicePilotStatus(serialNumber: string, status: boolean): void {
    AppLogger.info1(`Setting pilot status for device ${serialNumber}: ${status}`);
    this.repo.setPilotStatus([serialNumber], status);
  }

  stageDeviceTargetOU(serialNumber: string, targetOU: string): void {
    const record = this.getRecordsBySerialNumber([serialNumber])[0];
    if (!record?.deviceId) {
      throw new Error(`Device ${serialNumber} is not registered in Admin Console`);
    }
    AppLogger.info1(`Staging target OU for device ${serialNumber}: ${targetOU}`);
    this.repo.setDeviceTargetOU(serialNumber, targetOU);
  }

  stageSchoolTargets(emisNumber: string): number {
    AppLogger.info1(`Staging target OUs for school ${emisNumber}`);
    const records = this.getRecordsByEmisNumber([emisNumber]);
    let count = 0;
    for (const record of records) {
      if (!record.deviceId) continue;
      const target = parseTargetOrgUnit(record);
      if (record.serialNumber && target) {
        this.repo.setDeviceTargetOU(record.serialNumber, target);
        count++;
      }
    }
    AppLogger.info1(`Staged ${count} device targets for school ${emisNumber}`);
    return count;
  }

  rushSchoolDevices(emisNumber: string): { migrated: number; failed: number } {
    AppLogger.info1(`Starting bulk rush for school ${emisNumber}`);
    const records = this.getRecordsByEmisNumber([emisNumber]);
    let migrated = 0;
    let failed = 0;
    for (const record of records) {
      if (!record.deviceId || !record.serialNumber || !record.targetOrgUnitPath) {
        continue;
      }
      try {
        const updated = this.moveDeviceToOrgUnit(
          record.deviceId,
          record.targetOrgUnitPath,
        );
        if (updated?.orgUnitPath !== record.targetOrgUnitPath) {
          failed++;
          continue;
        }
        this.repo.updateCurrentOU(record.serialNumber, updated.orgUnitPath);
        migrated++;
      } catch (error) {
        AppLogger.error(`Bulk rush failed for device ${record.deviceId}`, error);
        failed++;
      }
    }
    AppLogger.info1(`Completed bulk rush for school ${emisNumber}: ${migrated} migrated, ${failed} failed`);
    return { migrated, failed };
  }

  setSchoolPilotStatus(emisNumber: string, status: boolean): number {
    AppLogger.info1(`Setting pilot status for school ${emisNumber}: ${status}`);
    const records = this.getRecordsByEmisNumber([emisNumber]);
    const serials = records
      .map((record) => record.serialNumber)
      .filter(Boolean);
    this.repo.setPilotStatus(serials, status);
    this.repo.setSchoolPilotFlag(emisNumber, status);
    return serials.length;
  }

  enrichRecordsWithTargetOU(records: DeviceRecord[]): DeviceRecord[] {
    return records.map((record) => ({
      ...record,
      suggestedTargetOrgUnitPath: parseTargetOrgUnit(record),
    }));
  }

  /**
   * Retrieves school records grouped by EMIS numbers.
   * @param {string[]} emisNumbers - An array of EMIS numbers to fetch records for.
   * @returns {SchoolDevicesRecord[]} An array of school records, grouped by EMIS number.
   */
  getSchoolRecords(): SchoolDevicesRecord[] {
    const schoolRecords = this.repo.getAllSchoolRecords();
    const allMatchingRecords = this.getAllRecords();

    const recordsByEmis: Record<string, DeviceRecord[]> = {};
    for (const record of allMatchingRecords) {
      if (!recordsByEmis[record.emisNumber]) {
        recordsByEmis[record.emisNumber] = [];
      }
      recordsByEmis[record.emisNumber].push(record);
    }

    return schoolRecords.map((school) => {
      const emis = school.emis;
      const records = recordsByEmis[emis] || [];
      return {
        school,
        devices: records,
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
    AppLogger.info2(`Moving device ${device_id} to ${org_unit_path}`);
    return AdminDirectory.Chromeosdevices.update(
      { orgUnitPath: org_unit_path },
      customer_id,
      device_id,
    );
  }

  createMissingOrgUnits(orgUnitPath: string): string[] {
    const normalized = orgUnitPath.trim().replace(/\\+/g, "/");
    if (!normalized.startsWith("/")) {
      throw new Error(`Invalid organizational unit path: ${orgUnitPath}`);
    }
    const customerId = Globals.retrieveCustomerId();
    const existing = new Set(
      (AdminDirectory.Orgunits.list(customerId).organizationUnits || [])
        .map((unit) => unit.orgUnitPath)
        .filter((path): path is string => Boolean(path)),
    );
    existing.add("/");

    const created: string[] = [];
    let parentPath = "/";
    for (const name of normalized.split("/").filter(Boolean)) {
      const path = parentPath === "/" ? `/${name}` : `${parentPath}/${name}`;
      if (!existing.has(path)) {
        const createdUnit = AdminDirectory.Orgunits.insert(
          { name, parentOrgUnitPath: parentPath },
          customerId,
        );
        existing.add(path);
        created.push(createdUnit.orgUnitPath || path);
      }
      parentPath = path;
    }
    AppLogger.info1(`Created ${created.length} missing OUs for ${normalized}`);
    return created;
  }
}
