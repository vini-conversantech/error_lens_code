import { app, BrowserWindow, ipcMain, dialog, shell, Menu, globalShortcut, nativeTheme, protocol, net } from 'electron'
import { pathToFileURL } from 'url'
import path from 'path'
import fs from 'fs'
import log from 'electron-log'
import { fileURLToPath } from 'url'
import simpleGit from 'simple-git'
import Database from 'better-sqlite3'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isDev = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL

// Configure logging
log.transports.file.level = 'info'
log.transports.console.level = 'debug'
log.info('Application starting...')

// Global exception handler
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error)
  app.exit(1)
})

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason)
})

// Register privileged schemes
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, bypassCSP: true } }
])

let mainWindow: BrowserWindow | null = null
let db: Database.Database | null = null

// Database initialization
function initDatabase() {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'errorlens.db')
  
  log.info('Initializing database at:', dbPath)
  
  db = new Database(dbPath)
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      last_opened DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
    
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      tokens INTEGER DEFAULT 0,
      cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS error_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      file_path TEXT NOT NULL,
      error_text TEXT NOT NULL,
      fixed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `)
  
  log.info('Database initialized successfully')
}

// Secure file path validation
function isPathSafe(basePath: string, targetPath: string): boolean {
  const resolved = path.resolve(basePath, targetPath)
  const base = path.resolve(basePath)
  return resolved.startsWith(base)
}

function createWindow() {
  log.info('Creating main window...')
  
  const iconPath = path.join(__dirname, isDev ? '../public/assets/logo.png' : '../dist/assets/logo.png')
  
  // if (process.platform === 'darwin') {
  //   app.dock.setIcon(iconPath)
  // }
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#070B10',
    title: 'ErrorLens Code',
    icon: iconPath,
    frame: false,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  })

  // Create application menu
  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'Open Folder', accelerator: 'CmdOrCtrl+O', click: () => mainWindow?.webContents.send('menu:open-folder') },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow?.webContents.send('menu:save') },
        { type: 'separator' },
        { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'AI',
      submenu: [
        { label: 'Ask AI', accelerator: 'CmdOrCtrl+Enter', click: () => mainWindow?.webContents.send('menu:ask-ai') },
        { label: 'Fix Error', accelerator: 'CmdOrCtrl+Shift+F', click: () => mainWindow?.webContents.send('menu:fix-error') },
        { type: 'separator' },
        { label: 'Command Palette', accelerator: 'CmdOrCtrl+K', click: () => mainWindow?.webContents.send('menu:command-palette') }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About ErrorLens Code', click: () => {
          dialog.showMessageBox(mainWindow!, {
            type: 'info',
            title: 'About ErrorLens Code',
            message: 'ErrorLens Code v1.0.0',
            detail: 'AI-first desktop coding IDE\nInspired by Cursor, Windsurf, and modern AI IDEs'
          })
        }}
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'

  if (isDev) {
    log.info('Loading development URL:', devUrl)
    mainWindow.loadURL(devUrl)
    // Devtools intentionally disabled so it doesn't overlap the app UI
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html')
    log.info('Loading production index:', indexPath)
    mainWindow.loadFile(indexPath)
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    log.info('Main window shown with title:', mainWindow?.getTitle())
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Register global shortcuts
function registerShortcuts() {
  globalShortcut.register('CmdOrCtrl+K', () => {
    mainWindow?.webContents.send('menu:command-palette')
  })
  globalShortcut.register('CmdOrCtrl+P', () => {
    mainWindow?.webContents.send('menu:quick-open')
  })
  globalShortcut.register('CmdOrCtrl+`', () => {
    mainWindow?.webContents.send('menu:toggle-terminal')
  })
}

// IPC Handlers

// File System
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  }
  return null
})

ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return { success: true, content }
  } catch (error: any) {
    log.error('Error reading file:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:readMedia', async (_, filePath: string) => {
  try {
    const buffer = fs.readFileSync(filePath)
    const ext = path.extname(filePath).toLowerCase().slice(1)
    
    const mimeMap: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'mov': 'video/quicktime'
    }
    
    const mimeType = mimeMap[ext] || 'application/octet-stream'
    const base64 = buffer.toString('base64')
    return { success: true, content: `data:${mimeType};base64,${base64}` }
  } catch (error: any) {
    log.error('Error reading media:', error)
    return { success: false, error: error.message }
  }
})


ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (error: any) {
    log.error('Error writing file:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:listFiles', async (_, dirPath: string) => {
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true })
    const result = items.map(item => ({
      name: item.name,
      path: path.join(dirPath, item.name),
      isDirectory: item.isDirectory()
    }))
    return { success: true, items: result }
  } catch (error: any) {
    log.error('Error listing files:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:createFile', async (_, filePath: string) => {
  try {
    fs.writeFileSync(filePath, '', 'utf-8')
    return { success: true }
  } catch (error: any) {
    log.error('Error creating file:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:createDirectory', async (_, dirPath: string) => {
  try {
    fs.mkdirSync(dirPath, { recursive: true })
    return { success: true }
  } catch (error: any) {
    log.error('Error creating directory:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:delete', async (_, targetPath: string) => {
  try {
    const stat = fs.statSync(targetPath)
    if (stat.isDirectory()) {
      fs.rmdirSync(targetPath, { recursive: true })
    } else {
      fs.unlinkSync(targetPath)
    }
    return { success: true }
  } catch (error: any) {
    log.error('Error deleting:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:rename', async (_, oldPath: string, newPath: string) => {
  try {
    fs.renameSync(oldPath, newPath)
    return { success: true }
  } catch (error: any) {
    log.error('Error renaming:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:exists', async (_, targetPath: string) => {
  return fs.existsSync(targetPath)
})

ipcMain.handle('fs:stat', async (_, targetPath: string) => {
  try {
    const stat = fs.statSync(targetPath)
    return { 
      success: true, 
      isDirectory: stat.isDirectory(),
      size: stat.size,
      mtime: stat.mtime.toISOString()
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Git
ipcMain.handle('git:status', async (_, repoPath: string) => {
  try {
    const git = simpleGit(repoPath)
    const status = await git.status()
    return { 
      success: true, 
      current: status.current,
      tracking: status.tracking,
      staged: status.staged,
      modified: status.modified,
      created: status.created,
      deleted: status.deleted,
      not_added: status.not_added,
      ahead: status.ahead,
      behind: status.behind
    }
  } catch (error: any) {
    log.error('Git status error:', error)
    return { success: false, error: error.message, isRepo: false }
  }
})

ipcMain.handle('git:branch', async (_, repoPath: string) => {
  try {
    const git = simpleGit(repoPath)
    const branch = await git.branch()
    return { success: true, current: branch.current, all: branch.all }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git:diff', async (_, repoPath: string, filePath?: string) => {
  try {
    const git = simpleGit(repoPath)
    const diff = filePath ? await git.diff([filePath]) : await git.diff()
    return { success: true, diff }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git:commit', async (_, repoPath: string, message: string) => {
  try {
    const git = simpleGit(repoPath)
    await git.add('.')
    const result = await git.commit(message)
    return { success: true, result }
  } catch (error: any) {
    log.error('Git commit error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git:log', async (_, repoPath: string, maxCount: number = 10) => {
  try {
    const git = simpleGit(repoPath)
    const log = await git.log({ maxCount })
    return { success: true, log: log.all }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Database
ipcMain.handle('db:query', async (_, query: string, params?: any[]) => {
  try {
    if (!db) throw new Error('Database not initialized')
    const stmt = db.prepare(query)
    const result = params ? stmt.all(...params) : stmt.all()
    return { success: true, data: result }
  } catch (error: any) {
    log.error('Database query error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('db:run', async (_, query: string, params?: any[]) => {
  try {
    if (!db) throw new Error('Database not initialized')
    const stmt = db.prepare(query)
    const result = params ? stmt.run(...params) : stmt.run()
    return { success: true, data: result }
  } catch (error: any) {
    log.error('Database run error:', error)
    return { success: false, error: error.message }
  }
})

// Settings (secure storage)
ipcMain.handle('settings:get', async (_, key: string) => {
  try {
    if (!db) throw new Error('Database not initialized')
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
    const row = stmt.get(key) as { value: string } | undefined
    return { success: true, value: row?.value }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('settings:set', async (_, key: string, value: string) => {
  try {
    if (!db) throw new Error('Database not initialized')
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    stmt.run(key, value)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Shell
ipcMain.handle('shell:openExternal', async (_, url: string) => {
  await shell.openExternal(url)
})

ipcMain.handle('shell:showItemInFolder', async (_, filePath: string) => {
  shell.showItemInFolder(filePath)
})

// Terminal
ipcMain.handle('terminal:execute', async (_, cwd: string, command: string) => {
  try {
    const { exec } = await import('child_process')
    const util = await import('util')
    const execPromise = util.promisify(exec)
    
    const { stdout, stderr } = await execPromise(command, { 
      cwd,
      timeout: 30000,
      maxBuffer: 1024 * 1024
    })
    
    return { 
      success: true, 
      output: stdout, 
      error: stderr || null 
    }
  } catch (error: any) {
    return { 
      success: false, 
      output: '', 
      error: error.message 
    }
  }
})

// App
ipcMain.handle('app:getPath', async (_, name: string) => {
  return app.getPath(name as any)
})

ipcMain.handle('app:getVersion', async () => {
  return app.getVersion()
})

// Window
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized()
})

// App lifecycle
app.whenReady().then(() => {
  log.info('App ready')
  
  // Register media protocol for local files
  protocol.handle('media', (request) => {
    try {
      const url = new URL(request.url)
      // On Windows, the path might start with / followed by drive letter
      let filePath = decodeURIComponent(url.pathname)
      
      // Remove leading slash if it precedes a drive letter on Windows (e.g. /C:/...)
      if (process.platform === 'win32' && filePath.startsWith('/')) {
        filePath = filePath.slice(1)
      }
      
      // If the URL was constructed as media://C:/path, the pathname is C:/path
      // If it was media:///C:/path, the pathname is /C:/path
      
      log.debug('Loading media file:', filePath)
      return net.fetch(pathToFileURL(filePath).toString())
    } catch (error) {
      log.error('Protocol handler error:', error)
      return new Response('Invalid path', { status: 400 })
    }
  })

  initDatabase()
  createWindow()
  registerShortcuts()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  if (db) {
    db.close()
  }
})

log.info('Main process initialized')