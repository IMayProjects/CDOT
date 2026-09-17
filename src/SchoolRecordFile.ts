import { DeviceRecord } from "./DeviceRecordFile";

export interface SchoolRecord {
  emis: string;
  schoolName: string;
  district: string;
  values: DeviceRecord[];
}
