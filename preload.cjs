const { contextBridge, ipcRenderer } = require("electron");

console.log("preload script");

contextBridge.exposeInMainWorld("electronAPI", {
  onProjectOpened: (callback) => ipcRenderer.on("project-open", (_event, value) => callback(value)),
});
