export { getClientConfig, saveClientConfig, getDistrictsDef } from "./Config";
import { DeviceRepository } from "./DeviceReposirotyFile";
import { DevicesService } from "./DevicesServiceFile";
import { DeviceQuery, groupDevices, queryDevices } from "./Queries";

import { parseTargetOrgUnit } from "./organizational_units";

export function searchDevices(query: DeviceQuery) {
  const records = queryDevices(
    DevicesService.getInstance().getAllRecords(),
    query,
  ).map((record) => ({
    ...record,
    targetOrgUnitPath: parseTargetOrgUnit(record),
  }));
  return {
    records,
    groups: groupDevices(records, query.groupBy),
  };
}

export function migrateDeviceToTarget(deviceId: string, targetOuPath: string) {
  const service = DevicesService.getInstance();
  const updatedDevice = service.moveDeviceToOrgUnit(deviceId, targetOuPath);
  if (updatedDevice && updatedDevice.orgUnitPath === targetOuPath) {
    return { success: true, newOuPath: updatedDevice.orgUnitPath };
  }
  throw new Error(
    `Migration verification failed. Current OU: ${updatedDevice?.orgUnitPath}`,
  );
}

export function toggleDevicePilotStatus(serialNumber: string, status: boolean) {
  DeviceRepository.getInstance().setPilotStatus([serialNumber], status);
  return { success: true };
}

export function toggleSchoolPilotStatus(emisNumber: string, status: boolean) {
  const records = DevicesService.getInstance().getRecordsByEmisNumber([
    emisNumber,
  ]);
  const serials = records.map((r) => r.serialNumber).filter(Boolean);
  if (serials.length > 0) {
    DeviceRepository.getInstance().setPilotStatus(serials, status);
  }
  return { success: true, count: serials.length };
}

export function listSchools() {
  const records = DevicesService.getInstance().getAllRecords();
  const emisNumbers = Array.from(
    new Set(records.map((record) => record.emisNumber).filter(Boolean)),
  );

  return DevicesService.getInstance()
    .getSchoolRecords(emisNumbers)
    .sort((left, right) => left.schoolName.localeCompare(right.schoolName));
}

/**
 * Creates the menu item to launch the sidebar
 */
export function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("CDOT Management")
    .addItem("Open Sidebar panel", "showSidebar")
    .addToUi();
}

/**
 * Opens the sidebar with the tabbed UI
 */
export function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("UI")
    .setTitle("CDOT Control Panel")
    .setWidth(600); // Standard sidebar width

  SpreadsheetApp.getUi().showSidebar(html);
}
