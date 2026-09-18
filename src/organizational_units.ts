import { DistrictsDef } from "./Config";
import { DeviceRecord } from "./DeviceRecordFile";

export const BASE_CHROMEBOOK_ORG_UNIT = "/Chromebooks";
export const ORG_UNIT = {
  ANE: DistrictsDef.ANE,
  ANW: DistrictsDef.ANW,
  AME: DistrictsDef.AME,
  AMW: DistrictsDef.AMW,
  BCM: DistrictsDef.BCM,
  CHE: DistrictsDef.CHE,
  CHW: DistrictsDef.CHW,
  JG: DistrictsDef.JG,
  NMB: DistrictsDef.NMB,
  ORTC: DistrictsDef.ORTC,
  ORTI: DistrictsDef.ORTI,
  SB: DistrictsDef.SB,

  ETL_LAB: "Lab Devices",
  Stolen: "Stolen",
  xdev: "xdev",
};

const stickyOus = [ORG_UNIT.xdev, ORG_UNIT.ETL_LAB, ORG_UNIT.Stolen];

export function parseTargetOrgUnit(record: DeviceRecord): string {
  // check if OU is sticky
  if (isStickyOU(record.currentOrgUnitPath)) return record.currentOrgUnitPath;

  let district = toTitleCase(record.district);
  const emis = record.emisNumber;

  if (([ORG_UNIT.AME, ORG_UNIT.AMW] as string[]).includes(district)) {
    district = district.replace("Amathole", "Amatole");
  }

  const sampleSuffix = record.isSample ? "/giga_sample_devices" : "";

  return `${BASE_CHROMEBOOK_ORG_UNIT}/${district}/${emis}${sampleSuffix}`;
}

export function isStickyOU(ou: string): boolean {
  return stickyOus.some((ous) => ou.endsWith(ous));
}

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
