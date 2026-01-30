import { create } from 'zustand';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface Modal {
  id: string;
  component: React.ComponentType<{ onClose: () => void; data?: unknown }>;
  data?: unknown;
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;

  // Panels
  rightPanelOpen: boolean;
  rightPanelTab: 'materials' | 'ai' | 'activity' | 'participants';

  // Modals
  modals: Modal[];

  // Toasts
  toasts: Toast[];

  // Canvas
  canvasZoom: number;
  canvasPosition: { x: number; y: number };

  // Search
  searchQuery: string;
  searchOpen: boolean;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;

  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelTab: (tab: 'materials' | 'ai' | 'activity' | 'participants') => void;

  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  setCanvasZoom: (zoom: number) => void;
  setCanvasPosition: (position: { x: number; y: number }) => void;
  resetCanvas: () => void;

  setSearchQuery: (query: string) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

let toastId = 0;
let modalId = 0;

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  sidebarOpen: true,
  sidebarWidth: 280,
  rightPanelOpen: true,
  rightPanelTab: 'materials',
  modals: [],
  toasts: [],
  canvasZoom: 1,
  canvasPosition: { x: 0, y: 0 },
  searchQuery: '',
  searchOpen: false,
  theme: 'system',

  // Sidebar actions
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },

  setSidebarWidth: (width) => {
    set({ sidebarWidth: Math.max(200, Math.min(400, width)) });
  },

  // Right panel actions
  toggleRightPanel: () => {
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen }));
  },

  setRightPanelOpen: (open) => {
    set({ rightPanelOpen: open });
  },

  setRightPanelTab: (tab) => {
    set({ rightPanelTab: tab, rightPanelOpen: true });
  },

  // Modal actions
  openModal: (modal) => {
    const id = `modal-${++modalId}`;
    set((state) => ({
      modals: [...state.modals, { ...modal, id }],
    }));
    return id;
  },

  closeModal: (id) => {
    set((state) => ({
      modals: state.modals.filter((m) => m.id !== id),
    }));
  },

  closeAllModals: () => {
    set({ modals: [] });
  },

  // Toast actions
  addToast: (toast) => {
    const id = `toast-${++toastId}`;
    const duration = toast.duration ?? 5000;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  // Canvas actions
  setCanvasZoom: (zoom) => {
    set({ canvasZoom: Math.max(0.1, Math.min(3, zoom)) });
  },

  setCanvasPosition: (position) => {
    set({ canvasPosition: position });
  },

  resetCanvas: () => {
    set({ canvasZoom: 1, canvasPosition: { x: 0, y: 0 } });
  },

  // Search actions
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  toggleSearch: () => {
    set((state) => ({ searchOpen: !state.searchOpen }));
  },

  setSearchOpen: (open) => {
    set({ searchOpen: open });
  },

  // Theme actions
  setTheme: (theme) => {
    set({ theme });
    if (typeof globalThis.window !== 'undefined') {
      const root = globalThis.document.documentElement;
      root.classList.remove('light', 'dark');
      if (theme === 'system') {
        const systemTheme = globalThis.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    }
  },
}));

// Helper hook for toast
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);
  const removeToast = useUIStore((state) => state.removeToast);

  return {
    toast: (options: Omit<Toast, 'id'>) => addToast(options),
    success: (title: string, description?: string) =>
      addToast({ title, description, type: 'success' }),
    error: (title: string, description?: string) =>
      addToast({ title, description, type: 'error' }),
    warning: (title: string, description?: string) =>
      addToast({ title, description, type: 'warning' }),
    info: (title: string, description?: string) =>
      addToast({ title, description, type: 'info' }),
    dismiss: (id: string) => removeToast(id),
  };
};
