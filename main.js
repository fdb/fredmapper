import { app, dialog, ipcMain, BrowserWindow } from "electron/main";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { createMenu } from "./menu.js";

let mainWindow;
let projectFile;
let projectWatcher;

function createWindow() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      webSecurity: false,
    },
  });

  mainWindow.loadFile("browser/index.html");
  mainWindow.on("ready-to-show", () => {
    handleDefaultProject();
  });
}

app.whenReady().then(() => {
  createWindow();
  const recentFiles = readRecentFiles();
  createMenu(handleMenu, recentFiles);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function sendIpcMessage(channel, ...args) {
  if (mainWindow.isDestroyed()) return;
  mainWindow.webContents.send(channel, ...args);
}

function handleMenu(name, filePath) {
  console.log("Menu selected:", name);
  if (name === "open") {
    handleOpenProject();
  } else if (name === "openRecent") {
    _loadProject(filePath);
    _watchProject(filePath);
    addRecentFile(filePath);
  } else if (name === "clearRecent") {
    clearRecentFiles();
  }
}

function handleOpenProject() {
  const files = dialog.showOpenDialogSync(mainWindow, {
    title: "Open Project",
    filters: [{ name: "Project File", extensions: ["fredmap"] }],
    properties: ["openFile"],
  });
  if (!files || files.length !== 1) return;
  const filePath = files[0];
  projectFile = filePath;
  _loadProject(filePath);
  _watchProject(filePath);
  addRecentFile(filePath);
}

function handleSaveProject(project) {
  if (!projectFile) {
    handleSaveProjectAs();
    return;
  }
  const jsonProject = JSON.stringify(project, null, 2);
  fs.writeFileSync(projectFile, jsonProject);
}

function handleSaveProjectAs(project) {
  const filePath = dialog.showSaveDialogSync(mainWindow, {
    title: "Save Project As",
    filters: [{ name: "Project File", extensions: ["fredmap"] }],
  });
  if (!filePath) return;
  projectFile = filePath;
  handleSaveProject(project);
}

function handleDefaultProject() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const filePath = path.join(__dirname, "projects/default/default.fredmap");
  _loadProject(filePath);
  _watchProject(filePath);
}

function _loadProject(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const project = JSON.parse(fileContent);
  const projectDir = path.dirname(filePath);
  const projectURL = pathToFileURL(projectDir).toString();
  sendIpcMessage("project-open", { project, projectURL });
}

function _watchProject(filePath) {
  if (projectWatcher) {
    projectWatcher.close();
  }
  projectWatcher = fs.watch(filePath, (eventType) => {
    if (eventType === "change") {
      console.log(`File ${filePath} has been modified, reloading...`);
      _loadProject(filePath); // Reload the file when it changes
    }
  });
}

const settingsPath = path.join(app.getPath("userData"), "settings.json");

function readSettings() {
  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
  } catch (error) {
    console.log(error);
    settings = { recentFiles: [] };
  }
  return settings;
}

function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

function readRecentFiles() {
  const settings = readSettings();
  return settings.recentFiles || [];
}

function saveRecentFiles(recentFiles) {
  const settings = readSettings();
  settings.recentFiles = recentFiles;
  saveSettings(settings);
}

function addRecentFile(filePath) {
  filePath = path.resolve(filePath);
  let recentFiles = readRecentFiles();
  // Filter out the file path if it's already in there
  recentFiles = recentFiles.filter((file) => file !== filePath);
  // Add the file path to the beginning of the array
  recentFiles.unshift(filePath);
  // Only keep the first 10 files
  recentFiles = recentFiles.slice(0, 10);
  saveRecentFiles(recentFiles);
}

function clearRecentFiles() {
  saveRecentFiles([]);
}
