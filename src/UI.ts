export { getClientConfig, saveClientConfig } from "./Config";

/**
 * Creates the menu item to launch the sidebar
 */
export function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("CDOT Management")
    .addItem("Open Sidebar panel", "showSidebar")
    .addToUi();
}

/**
 * Opens the sidebar with the tabbed UI
 */
export function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("UI")
    .setTitle("CDOT Control Panel")
    .setWidth(300); // Standard sidebar width

  SpreadsheetApp.getUi().showSidebar(html);
}
