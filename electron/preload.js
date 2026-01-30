const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Notifications
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', { title, body });
  },

  // Menu events
  onMenuNewSession: (callback) => {
    ipcRenderer.on('menu:new-session', callback);
    return () => {
      ipcRenderer.removeListener('menu:new-session', callback);
    };
  },

  // File operations
  onFileOpen: (callback) => {
    ipcRenderer.on('file:open', callback);
    return () => {
      ipcRenderer.removeListener('file:open', callback);
    };
  },

  // Window controls (for custom title bar if needed)
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
});

// Add types for TypeScript (if using)
// These are available in the renderer via window.electronAPI
