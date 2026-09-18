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
  targetOuPath: string,
  serialNumber: string,
) {
  const service = DevicesService.getInstance();
  const updatedDevice = service.moveDeviceToOrgUnit(deviceId, targetOuPath);
  if (updatedDevice && updatedDevice.orgUnitPath === targetOuPath) {
    service.updateCurrentOrgUnit(serialNumber, updatedDevice.orgUnitPath);
    return { success: true, newOuPath: updatedDevice.orgUnitPath };
  }
  throw new Error(
    `Migration verification failed. Current OU: ${updatedDevice?.orgUnitPath}`,
  );
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
    .setWidth(300); // Standard sidebar width

  SpreadsheetApp.getUi().showSidebar(html);
}
