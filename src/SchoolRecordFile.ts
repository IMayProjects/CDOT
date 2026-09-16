import { DeviceRecord } from "./DeviceRecordFile";

export interface SchoolRecord {
  emis: string;
  schoolName: string;
  values: DeviceRecord[];
}
