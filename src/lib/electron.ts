// Renderer process utilities for Electron integration
// This file provides TypeScript types and utilities for using the Electron API

// Type definitions for the Electron API exposed via preload
export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<NodeJS.Platform>;
  showNotification: (title: string, body: string) => void;
  onMenuNewSession: (callback: () => void) => () => void;
  onFileOpen: (callback: (event: unknown, path: string) => void) => () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
}

// Augment the Window interface
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// Check if running in Electron
export function isElectron(): boolean {
  // Renderer process
  if (typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined') {
    return true;
  }

  // Main process
  if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
    return true;
  }

  // Detect the user agent
  if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.includes('Electron')) {
    return true;
  }

  return false;
}

// Get the Electron API safely
export function getElectronAPI(): ElectronAPI | null {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI;
  }
  return null;
}

// Show a native notification (works in both Electron and browser)
export async function showNotification(title: string, body: string): Promise<void> {
  const api = getElectronAPI();
  
  if (api) {
    // Use Electron's native notification
    api.showNotification(title, body);
  } else if ('Notification' in window) {
    // Fall back to browser notifications
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, { body });
    }
  }
}

// Get app version
export async function getAppVersion(): Promise<string> {
  const api = getElectronAPI();
  
  if (api) {
    return api.getAppVersion();
  }
  
  // Return package.json version for web
  return process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';
}

// Get platform
export async function getPlatform(): Promise<string> {
  const api = getElectronAPI();
  
  if (api) {
    return api.getPlatform();
  }
  
  // Detect platform from user agent for web
  const ua = navigator.userAgent;
  if (ua.includes('Mac')) return 'darwin';
  if (ua.includes('Win')) return 'win32';
  if (ua.includes('Linux')) return 'linux';
  return 'unknown';
}
