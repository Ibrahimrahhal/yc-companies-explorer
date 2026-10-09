import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron'
import { join } from 'path'
import { LocalStore } from './storage'
import { getFeedPage, getSavedStartups, ensureDailyFeed, rebuildDailyFeed } from './feed'
import { shouldAutoSync, syncYC } from './yc-api'
import { todayKey } from './batch'

let mainWindow: BrowserWindow | null = null
let store: LocalStore

const ZOOM_MIN = 0.5
const ZOOM_MAX = 3
const ZOOM_STEP = 0.1

function clampZoom(factor: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(factor * 10) / 10))
}

function applyZoom(factor: number): void {
  if (!mainWindow) return
  const next = clampZoom(factor)
  mainWindow.webContents.setZoomFactor(next)
  store.setZoomFactor(next)
}

function zoomBy(delta: number): void {
  if (!mainWindow) return
  applyZoom(mainWindow.webContents.getZoomFactor() + delta)
}

function installZoomHandlers(win: BrowserWindow): void {
  win.webContents.setVisualZoomLevelLimits(1, 3).catch(() => undefined)

  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    const ctrl = input.control || input.meta
    if (!ctrl) return

    if (input.key === '+' || input.key === '=' || input.code === 'NumpadAdd') {
      event.preventDefault()
      zoomBy(ZOOM_STEP)
    } else if (input.key === '-' || input.key === '_' || input.code === 'NumpadSubtract') {
      event.preventDefault()
      zoomBy(-ZOOM_STEP)
    } else if (input.key === '0' || input.code === 'Numpad0') {
      event.preventDefault()
      applyZoom(1)
    }
  })

  win.webContents.on('zoom-changed', (_event, direction) => {
    zoomBy(direction === 'in' ? ZOOM_STEP : -ZOOM_STEP)
  })

  win.webContents.on('did-finish-load', () => {
    applyZoom(store.getZoomFactor())
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 880,
    minHeight: 640,
    show: false,
    backgroundColor: '#ffffff',
    title: 'YC Explorer',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'View',
        submenu: [
          {
            label: 'Zoom In',
            accelerator: 'CommandOrControl+=',
            click: () => zoomBy(ZOOM_STEP)
          },
          {
            label: 'Zoom In',
            accelerator: 'CommandOrControl+Plus',
            visible: false,
            click: () => zoomBy(ZOOM_STEP)
          },
          {
            label: 'Zoom Out',
            accelerator: 'CommandOrControl+-',
            click: () => zoomBy(-ZOOM_STEP)
          },
          {
            label: 'Reset Zoom',
            accelerator: 'CommandOrControl+0',
            click: () => applyZoom(1)
          },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      }
    ])
  )

  installZoomHandlers(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc(): void {
  ipcMain.handle('app:getBootstrap', async () => {
    ensureDailyFeed(store)
    const state = store.getState()
    return {
      lastSyncedAt: state.lastSyncedAt,
      companyCount: state.companies.length,
      savedCount: state.savedIds.length,
      dataDir: store.getDataDir(),
      today: todayKey(),
      changes: state.changes
        ? {
            generated_at: state.changes.generated_at,
            summary: state.changes.summary,
            added: state.changes.added,
            updated: state.changes.updated
          }
        : null
    }
  })

  ipcMain.handle('feed:get', async (_e, loadMore?: boolean) => {
    return getFeedPage(store, Boolean(loadMore))
  })

  ipcMain.handle('feed:saved', async () => {
    return getSavedStartups(store)
  })

  ipcMain.handle('startup:toggleSave', async (_e, id: number) => {
    const saved = store.toggleSaved(id)
    return { id, saved, savedIds: store.getSavedIds() }
  })

  ipcMain.handle('sync:run', async (_e, refreshFeed?: boolean) => {
    return syncYC(store, { refreshFeed: refreshFeed !== false })
  })

  ipcMain.handle('feed:reshuffle', async () => {
    rebuildDailyFeed(store)
    return getFeedPage(store, false)
  })

  ipcMain.handle('shell:openExternal', async (_e, url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      await shell.openExternal(url)
    }
  })

  ipcMain.handle('shell:openDataDir', async () => {
    await shell.openPath(store.getDataDir())
  })

  ipcMain.handle('zoom:by', async (_e, delta: number) => {
    zoomBy(Number(delta) || 0)
    return mainWindow?.webContents.getZoomFactor() ?? 1
  })

  ipcMain.handle('zoom:reset', async () => {
    applyZoom(1)
    return 1
  })
}

app.whenReady().then(async () => {
  store = new LocalStore()
  registerIpc()
  createWindow()

  // Background sync on launch if stale / empty
  if (shouldAutoSync(store) || store.getCompanies().length === 0) {
    syncYC(store)
      .then((result) => {
        mainWindow?.webContents.send('sync:complete', result)
      })
      .catch(() => undefined)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
