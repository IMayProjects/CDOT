import { DeviceRepository } from "./DeviceReposirotyFile";
import { DevicesService } from "./DevicesServiceFile";

const CONTINUATION_TOKEN_KEY = "DEVICE_MIGRATION_START_INDEX";
// 4.5 minutes in milliseconds
const MAX_EXECUTION_TIME_MS = 4.5 * 60 * 1000;

export class DeviceProcessorService {
  private repository: DeviceRepository;
  private devicesService: DevicesService;

  constructor() {
    this.repository = DeviceRepository.getInstance();
    this.devicesService = DevicesService.getInstance();
  }

  /**
   * Processes the device migrations in batches.
   * Uses continuation tokens to resume from the last processed index.
   */
  public processBatch() {
    const startTime = Date.now();
    const properties = PropertiesService.getScriptProperties();
    const token = properties.getProperty(CONTINUATION_TOKEN_KEY);

    let startIndex = 0;
    if (token) {
      startIndex = parseInt(token, 10);
    }

    const allRecords = this.repository.getAllRecords();

    // If we've processed all records, clear token and exit.
    if (startIndex >= allRecords.length) {
      Logger.log("All records have been processed. Clearing token.");
      properties.deleteProperty(CONTINUATION_TOKEN_KEY);
      return;
    }

    let i = startIndex;
    for (; i < allRecords.length; i++) {
      const record = allRecords[i];

      // If paths don't match, the device needs to be moved
      if (record.currentOrgUnitPath !== record.targetOrgUnitPath) {
        if (record.deviceId && record.targetOrgUnitPath) {
          try {
            Logger.log(
              `Moving device ${record.deviceId} to ${record.targetOrgUnitPath}`,
            );
            this.devicesService.moveDeviceToOrgUnit(
              record.deviceId,
              record.targetOrgUnitPath,
            );

            Logger.log(`Successfully moved and updated ${record.serialNumber}`);
          } catch (e: any) {
            Logger.log(`Error moving device ${record.deviceId}: ${e.message}`);
            // Could log error to a sheet or continue
          }
        } else {
          Logger.log(
            `Missing deviceId or targetOrgUnitPath for serial: ${record.serialNumber}`,
          );
        }
      }

      // Check if we are approaching the 6-minute execution limit
      if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
        Logger.log(
          `Approaching execution time limit. Saving continuation token at index ${i + 1}.`,
        );
        properties.setProperty(CONTINUATION_TOKEN_KEY, (i + 1).toString());
        this.scheduleNextRun();
        return;
      }
    }

    // Finished processing all records without hitting the time limit
    Logger.log("Finished processing all records in this batch.");
    properties.deleteProperty(CONTINUATION_TOKEN_KEY);
  }

  /**
   * Schedules a time-driven trigger to run the process again in 1 minute.
   */
  private scheduleNextRun() {
    ScriptApp.newTrigger("runDeviceMigration")
      .timeBased()
      .after(1 * 60 * 1000) // 1 minute
      .create();
  }
}
