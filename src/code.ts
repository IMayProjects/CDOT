import { DeviceProcessorService } from "./processor";
import { DevicesService } from "./DevicesServiceFile";
import { DeviceRepository } from "./DeviceReposirotyFile";

function myFunction() {
  let records = DevicesService.getInstance().getRecordsBySerialNumber([
    "YX0BB42Z",
    "PF5PH350",
  ]);
  for (const record of records) {
    console.log(JSON.stringify(record));
  }
}

/**
 * Entry point for the time-driven trigger to migrate devices.
 */
function runDeviceMigration() {
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
