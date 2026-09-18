import { DevicesService } from "./DevicesServiceFile";
import { AppLogger } from "./logger";

const CONTINUATION_TOKEN_KEY = "DEVICE_MIGRATION_START_INDEX";
// 4.5 minutes in milliseconds
const MAX_EXECUTION_TIME_MS = 4.5 * 60 * 1000;

export class DeviceProcessorService {
  private devicesService: DevicesService;

  constructor() {
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

    const allSamples = this.devicesService.getProcessorRecords();

    // If we've processed all records, clear token and exit.
    if (startIndex >= allSamples.length) {
      AppLogger.info1("All records have been processed. Clearing token.");
      properties.deleteProperty(CONTINUATION_TOKEN_KEY);
      return;
    }

    let i = startIndex;
    for (; i < allSamples.length; i++) {
      const record = allSamples[i];

      // If paths don't match, the device needs to be moved
      if (record.currentOrgUnitPath !== record.targetOrgUnitPath) {
        if (record.deviceId && record.targetOrgUnitPath) {
          // why is this nested??
          try {
            AppLogger.info2(
              `Moving device ${record.deviceId} to ${record.targetOrgUnitPath}`,
            );
            this.devicesService.moveDeviceToOrgUnit(
              record.deviceId,
              record.targetOrgUnitPath,
            );

            // Check if the move was successful by querying OU from AdminDirectory
            const updatedDevice = this.devicesService.getDeviceByDeviceId(
              record.deviceId,
            );
            if (
              updatedDevice &&
              updatedDevice.orgUnitPath === record.targetOrgUnitPath
            ) {
              // Replace current OU with return value from AdminDirectory
              this.devicesService.updateCurrentOrgUnit(
                record.serialNumber,
                updatedDevice.orgUnitPath,
              );
              AppLogger.info1(
                `Successfully moved and updated ${record.serialNumber}`,
              );
            } else {
              AppLogger.warn(
                `Move verification failed for ${record.serialNumber}. Current OU is ${updatedDevice?.orgUnitPath}`,
              );
              properties.setProperty(CONTINUATION_TOKEN_KEY, i.toString());
              AppLogger.warn("Stopping batch after migration verification failure.");
              return;
            }
          } catch (e: any) {
            AppLogger.error(
              `Error moving device ${record.deviceId}: ${e.message}`,
              e,
            );
            properties.setProperty(CONTINUATION_TOKEN_KEY, i.toString());
            AppLogger.warn("Stopping batch after migration failure.");
            return;
          }
        } else {
          AppLogger.warn(
            `Missing deviceId or targetOrgUnitPath for serial: ${record.serialNumber}`,
          );
        }
      }

      // Check if we are approaching the 6-minute execution limit
      if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
        AppLogger.info1(
          `Approaching execution time limit. Saving continuation token at index ${i + 1}.`,
        );
        properties.setProperty(CONTINUATION_TOKEN_KEY, (i + 1).toString());
        this.scheduleNextRun();
        return;
      }
    }

    // Finished processing all records without hitting the time limit
    AppLogger.info1("Finished processing all records in this batch.");
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
