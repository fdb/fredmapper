import { app, Menu } from "electron";
import path from "node:path";

const isMac = process.platform === "darwin";

export function createMenu(menuHandler, recentFiles = []) {
  let recentItems;
  if (recentFiles.length === 0) {
    recentItems = [{ key: "null", label: "No Recent Projects", enabled: false }];
  } else {
    recentItems = recentFiles.map((filePath) => ({
      key: filePath,
      label: path.basename(filePath),
      click: () => menuHandler("openRecent", filePath),
    }));
    recentItems.push({ type: "separator" });
    recentItems.push({ label: "Clear Recent Projects", click: () => menuHandler("clearRecent") });
  }

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      role: "fileMenu",
      label: "File",
      submenu: [
        { label: "New Project", accelerator: "CmdOrCtrl+N", click: () => menuHandler("new") },
        { type: "separator" },
        { label: "Open Project…", accelerator: "CmdOrCtrl+O", click: () => menuHandler("open") },
        {
          key: "recentProjects",
          label: "Open Recent",
          submenu: recentItems,
        },
        { type: "separator" },
        { label: "Save", accelerator: "CmdOrCtrl+S", click: () => menuHandler("save") },
        {
          label: "Save As…",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => menuHandler("save-as"),
        },
        ...(isMac ? [] : [{ role: "quit" }]),
      ],
    },
    {
      role: "editMenu",
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
              { type: "separator" },
              {
                label: "Speech",
                submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
              },
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
      ],
    },
    {
      role: "viewMenu",
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
