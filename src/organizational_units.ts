import { DeviceRecord } from "./DeviceRecordFile";

export const BASE_CHROMEBOOK_ORG_UNIT = "/Chromebooks";
export const ORG_UNIT = {
  ANE: "Alfred Nzo East",
  ANW: "Alfred Nzo West",
  AME: "Amathole East",
  AMW: "Amathole West",
  BCM: "Buffalo City",
  CHE: "Chris Hani East",
  CHW: "Chris Hani West",
  JG: "Joe Gqabi",
  NMB: "Nelson Mandela Bay",
  ORTC: "OR Tambo Coastal",
  ORTI: "OR Tambo Inland",
  SB: "Sarah Baartman",

  ETL_LAB: "Lab Devices",
  Stolen: "Stolen",
  xdev: "xdev",
};

const stickyOus = [ORG_UNIT.xdev, ORG_UNIT.ETL_LAB, ORG_UNIT.Stolen];

export function parseTargetOrgUnit(record: DeviceRecord): string {
  // check if OU is sticky
  if (isStickyOU(record.currentOrgUnitPath)) return record.currentOrgUnitPath;

  let district = record.district;
  const emis = record.emisNumber;

  if ([ORG_UNIT.AME, ORG_UNIT.AMW].includes(district)) {
    district = district.replace("Amathole", "Amatole");
  }

  const sampleSuffix = record.isSample ? "/giga_sample_devices" : "";

  return `${BASE_CHROMEBOOK_ORG_UNIT}/${district}/${emis}${sampleSuffix}`;
}

export function isStickyOU(ou: string): boolean {
  return stickyOus.some((ous) => ou.endsWith(ous));
}
