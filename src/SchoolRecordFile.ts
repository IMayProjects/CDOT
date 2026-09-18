import { DeviceRecord } from "./DeviceRecordFile";

export interface SchoolDevicesRecord {
  school: SchoolRecord;
  devices: DeviceRecord[];
}

export interface SchoolRecord {
  emis: string;
  schoolName: string;
  district: string;
  isPilot: boolean;
}
export const SchoolSheetName = "schools";
export const SchoolRecordTitleRow = 1;
export const SchoolRecordColumn = {
  EMIS: 0,
  SCHOOL_NAME: 1,
  DISTRICT: 2,
  PILOT_FLAG: 3,
};
