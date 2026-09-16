import { DeviceProcessorService } from "./processor";
import { DevicesService } from "./DevicesServiceFile";
import { DeviceRepository } from "./DeviceReposirotyFile";
import { DeviceRecord } from "./DeviceRecordFile";
import { SchoolRecord } from "./SchoolRecordFile";

/**
 * Gets devices for a specific school (EMIS number)
 * @param {string} emis - EMIS number of the school
 * @returns {Object} Object with device data
 */

/**
 * Entry point for the time-driven trigger to migrate devices.
 */
export function runDeviceMigration() {
  const processor = new DeviceProcessorService();

  // We need to delete the current trigger that invoked this function
  // so we don't accumulate thousands of triggers.
  // Note: Only delete the programmatic triggers named 'runDeviceMigration'.
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === "runDeviceMigration") {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  processor.processBatch();
}
