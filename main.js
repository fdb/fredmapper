import { app, dialog, ipcMain, BrowserWindow } from "electron/main";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { createMenu } from "./menu.js";

let mainWindow;
let projectFile;

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
    console.log("ready");
    handleDefaultProject();
  });
}

app.whenReady().then(() => {
  createWindow();
  createMenu(handleMenu);

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

function handleMenu(name) {
  console.log("Menu selected:", name);
  if (name === "open") {
    handleOpenProject();
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
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const project = JSON.parse(fileContent);
  const projectDir = path.dirname(filePath);
  const projectURL = pathToFileURL(projectDir).toString();
  sendIpcMessage("project-open", { project, projectURL });
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
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const project = JSON.parse(fileContent);
  const projectDir = path.dirname(filePath);
  const projectURL = pathToFileURL(projectDir).toString();
  sendIpcMessage("project-open", { project, projectURL });
}
