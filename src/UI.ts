export { getClientConfig, saveClientConfig, getDistrictsDef } from "./Config";
import { DevicesService } from "./DevicesServiceFile";
import { DeviceQuery, groupDevices, queryDevices } from "./Queries";

export function searchDevices(query: DeviceQuery) {
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

export function stageDeviceTarget(
  serialNumber: string,
  targetOuPath: string,
) {
  if (!targetOuPath) throw new Error("A target OU is required");
  DevicesService.getInstance().stageDeviceTargetOU(serialNumber, targetOuPath);
  return { success: true, targetOuPath };
}

export function toggleDevicePilotStatus(serialNumber: string, status: boolean) {
  DevicesService.getInstance().setDevicePilotStatus(serialNumber, status);
  return { success: true };
}

export function toggleSchoolPilotStatus(emisNumber: string, status: boolean) {
  const count = DevicesService.getInstance().setSchoolPilotStatus(
    emisNumber,
    status,
  );
  return { success: true, count };
}

export function listSchools() {
  return DevicesService.getInstance()
    .getSchoolRecords()
    .sort((left, right) =>
      left.school.schoolName.localeCompare(right.school.schoolName),
    );
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
    .setWidth(300); // Standard sidebar width

  SpreadsheetApp.getUi().showSidebar(html);
}
