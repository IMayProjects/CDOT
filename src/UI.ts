export { getClientConfig, saveClientConfig, getDistrictsDef } from "./Config";
import { DevicesService } from "./DevicesServiceFile";
import { DeviceQuery, groupDevices, queryDevices } from "./Queries";
import { AppLogger } from "./logger";

export function searchDevices(query: DeviceQuery) {
  AppLogger.info1(`UI search devices: groupBy=${query.groupBy}`);
  const filteredRecords = queryDevices(
    DevicesService.getInstance().getAllRecords(),
    query,
  );
  const records =
    DevicesService.getInstance().enrichRecordsWithTargetOU(filteredRecords);
  return {
    records,
    groups: groupDevices(records, query.groupBy),
  };
}

export function migrateDeviceToTarget(
  deviceId: string,
  serialNumber: string,
) {
  AppLogger.info1(`UI rush requested for device ${deviceId} (${serialNumber})`);
  const service = DevicesService.getInstance();
  const record = service
    .getRecordsBySerialNumber([serialNumber])
    .find((item) => item.deviceId === deviceId);
  const targetOuPath = record?.targetOrgUnitPath;
  if (!targetOuPath) {
    throw new Error(`No staged target OU found for ${serialNumber}`);
  }
  const updatedDevice = service.moveDeviceToOrgUnit(deviceId, targetOuPath);
  if (updatedDevice && updatedDevice.orgUnitPath === targetOuPath) {
    service.updateCurrentOrgUnit(serialNumber, updatedDevice.orgUnitPath);
    return { success: true, newOuPath: updatedDevice.orgUnitPath };
  }
  throw new Error(
    `Migration verification failed. Current OU: ${updatedDevice?.orgUnitPath}`,
  );
}

export function recoverDeviceTargetOU(deviceId: string, serialNumber: string) {
  AppLogger.info1(`UI OU recovery requested for device ${deviceId} (${serialNumber})`);
  const service = DevicesService.getInstance();
  const record = service
    .getRecordsBySerialNumber([serialNumber])
    .find((item) => item.deviceId === deviceId);
  if (!record?.targetOrgUnitPath) {
    throw new Error(`No staged target OU found for ${serialNumber}`);
  }
  const created = service.createMissingOrgUnits(record.targetOrgUnitPath);
  return { success: true, created };
}

export function stageDeviceTarget(
  serialNumber: string,
  targetOuPath: string,
) {
  AppLogger.info1(`UI stage requested for device ${serialNumber}`);
  if (!targetOuPath) throw new Error("A target OU is required");
  DevicesService.getInstance().stageDeviceTargetOU(serialNumber, targetOuPath);
  return { success: true, targetOuPath };
}

export function stageSchoolTargets(emisNumber: string) {
  AppLogger.info1(`UI stage requested for school ${emisNumber}`);
  const count = DevicesService.getInstance().stageSchoolTargets(emisNumber);
  return { success: true, count };
}

export function rushSchoolDevices(emisNumber: string) {
  AppLogger.info1(`UI rush requested for school ${emisNumber}`);
  return { success: true, ...DevicesService.getInstance().rushSchoolDevices(emisNumber) };
}

export function toggleDevicePilotStatus(serialNumber: string, status: boolean) {
  AppLogger.info1(`UI pilot toggle for device ${serialNumber}: ${status}`);
  DevicesService.getInstance().setDevicePilotStatus(serialNumber, status);
  return { success: true };
}

export function toggleSchoolPilotStatus(emisNumber: string, status: boolean) {
  AppLogger.info1(`UI pilot toggle for school ${emisNumber}: ${status}`);
  const count = DevicesService.getInstance().setSchoolPilotStatus(
    emisNumber,
    status,
  );
  return { success: true, count };
}

export function listSchools() {
  AppLogger.info1("UI requested school list");
  return DevicesService.getInstance()
    .getSchoolRecords()
    .sort((left, right) =>
      left.school.schoolName.localeCompare(right.school.schoolName),
    );
}

export function logUiOutcome(
  action: string,
  outcome: "success" | "failure",
  detail: string,
) {
  const message = `UI ${outcome}: ${action}${detail ? ` — ${detail}` : ""}`;
  if (outcome === "failure") AppLogger.error(message);
  else AppLogger.info1(message);
  return { success: true };
}

/**
 * Creates the menu item to launch the sidebar
 */
export function onOpen() {
  AppLogger.info1("UI menu opened");
  SpreadsheetApp.getUi()
    .createMenu("CDOT Management")
    .addItem("Open Sidebar panel", "showSidebar")
    .addToUi();
}

/**
 * Opens the sidebar with the tabbed UI
 */
export function showSidebar() {
  AppLogger.info1("Sidebar requested");
  const html = HtmlService.createHtmlOutputFromFile("UI")
    .setTitle("CDOT Control Panel")
    .setWidth(300); // Standard sidebar width

  SpreadsheetApp.getUi().showSidebar(html);
}
