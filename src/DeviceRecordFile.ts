export const DeviceRecordsSheetName = "device_records";
export const ProcessorRecordsSheetName = "filtered_device_records";
export const DeviceRecordsTitleRow = 1;
export const DeviceRecordsSheetColumn = {
  SERIAL_NUMBER: 0,
  EMIS_NUMBER: 1,
  DEVICE_ID: 4,
  SCHOOL_NAME: 2,
  DISTRICT: 3,
  CURRENT_OU_PATH: 5,
  TARGET_OU_PATH: 6,
  IS_SAMPLE: 7,
};

export interface DeviceRecord {
  serialNumber: string;
  emisNumber: string;
  schoolName: string;
  district: string;
  deviceId: string;
  currentOrgUnitPath: string;
  targetOrgUnitPath: string;
  isSample: boolean;
}

export const AcDevicesSheetName = "admin_console_device_cache";
export const AcDevicesColumn = {
  SERIAL_NUMBER: 0,
  DEVICE_ID: 1,
  CURRENT_OU_PATH: 2,
  TARGET_OU_PATH: 3,
  IS_SAMPLE: 4,
};
