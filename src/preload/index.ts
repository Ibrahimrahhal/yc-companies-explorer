import { contextBridge, ipcRenderer } from 'electron'
import type { Bootstrap, FeedPage, Startup, SyncResult } from '../shared/types'

const api = {
  getBootstrap: (): Promise<Bootstrap> => ipcRenderer.invoke('app:getBootstrap'),
  getFeed: (loadMore = false): Promise<FeedPage> => ipcRenderer.invoke('feed:get', loadMore),
  reshuffleFeed: (): Promise<FeedPage> => ipcRenderer.invoke('feed:reshuffle'),
  getSaved: (): Promise<Startup[]> => ipcRenderer.invoke('feed:saved'),
  toggleSave: (id: number): Promise<{ id: number; saved: boolean; savedIds: number[] }> =>
    ipcRenderer.invoke('startup:toggleSave', id),
  sync: (refreshFeed = true): Promise<SyncResult> => ipcRenderer.invoke('sync:run', refreshFeed),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),
  openDataDir: (): Promise<void> => ipcRenderer.invoke('shell:openDataDir'),
  zoomBy: (delta: number): Promise<number> => ipcRenderer.invoke('zoom:by', delta),
  resetZoom: (): Promise<number> => ipcRenderer.invoke('zoom:reset'),
  onSyncComplete: (cb: (result: SyncResult) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, result: SyncResult): void => cb(result)
    ipcRenderer.on('sync:complete', listener)
    return () => ipcRenderer.removeListener('sync:complete', listener)
  }
}

contextBridge.exposeInMainWorld('yc', api)

export type YCApi = typeof api
