import { DeviceRecord } from "./DeviceRecordFile";

export type QueryJoinMode = "AND" | "OR";
export type DeviceGroupMode =
  | "none"
  | "school"
  | "district"
  | "districtSchool";

export interface FieldQuery<T> {
  enabled: boolean;
  values: T[];
}

export interface DeviceQuery {
  joinMode: QueryJoinMode;
  groupBy: DeviceGroupMode;
  serialNumbers: FieldQuery<string>;
  emisNumbers: FieldQuery<string>;
  districts: FieldQuery<string>;
  sampleFlags: FieldQuery<boolean>;
}

export interface DeviceGroup {
  key: string;
  label: string;
  subtitle?: string;
  records: DeviceRecord[];
  children?: DeviceGroup[];
}

function matchesAny<T>(value: T, values: T[]): boolean {
  return values.length === 0 || values.includes(value);
}

function normalizedValues(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

export function queryDevices(
  records: DeviceRecord[],
  query: DeviceQuery,
): DeviceRecord[] {
  const serialNumbers = normalizedValues(query.serialNumbers.values);
  const emisNumbers = normalizedValues(query.emisNumbers.values);
  const districts = normalizedValues(query.districts.values).map((district) =>
    district.toLowerCase(),
  );

  const predicates: Array<(record: DeviceRecord) => boolean> = [];

  if (query.serialNumbers.enabled && serialNumbers.length) {
    predicates.push((record) => matchesAny(record.serialNumber, serialNumbers));
  }

  if (query.emisNumbers.enabled && emisNumbers.length) {
    predicates.push((record) => matchesAny(record.emisNumber, emisNumbers));
  }

  if (query.districts.enabled && districts.length) {
    predicates.push((record) =>
      matchesAny(record.district.toLowerCase(), districts),
    );
  }

  if (query.sampleFlags.enabled && query.sampleFlags.values.length) {
    predicates.push((record) =>
      matchesAny(record.isSample, query.sampleFlags.values),
    );
  }

  if (!predicates.length) {
    return records;
  }

  return records.filter((record) =>
    query.joinMode === "OR"
      ? predicates.some((predicate) => predicate(record))
      : predicates.every((predicate) => predicate(record)),
  );
}

function groupByKey(
  records: DeviceRecord[],
  keySelector: (record: DeviceRecord) => string,
  labelSelector: (record: DeviceRecord) => string,
  subtitleSelector?: (record: DeviceRecord) => string,
): DeviceGroup[] {
  const groups = new Map<string, DeviceGroup>();

  for (const record of records) {
    const key = keySelector(record);
    const group = groups.get(key) || {
      key,
      label: labelSelector(record) || "Unknown",
      subtitle: subtitleSelector?.(record),
      records: [],
    };
    group.records.push(record);
    groups.set(key, group);
  }

  return Array.from(groups.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

export function groupDevices(
  records: DeviceRecord[],
  groupBy: DeviceGroupMode,
): DeviceGroup[] {
  if (groupBy === "none") return [];

  if (groupBy === "school") {
    return groupByKey(
      records,
      (record) => `${record.emisNumber}:${record.schoolName}`,
      (record) => record.schoolName,
      (record) => `EMIS ${record.emisNumber}`,
    );
  }

  if (groupBy === "district") {
    return groupByKey(
      records,
      (record) => record.district,
      (record) => record.district,
    );
  }

  const districts = groupByKey(
    records,
    (record) => record.district,
    (record) => record.district,
  );

  return districts.map((district) => ({
    ...district,
    children: groupByKey(
      district.records,
      (record) => `${record.emisNumber}:${record.schoolName}`,
      (record) => record.schoolName,
      (record) => `EMIS ${record.emisNumber}`,
    ),
  }));
}
