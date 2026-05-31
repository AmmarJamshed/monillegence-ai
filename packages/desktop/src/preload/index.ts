import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('monillegence', {
  getAgentUrl: () => ipcRenderer.invoke('monillegence:getAgentUrl') as Promise<{
    http: string;
    ws: string;
  }>,
  getLegalDisclaimer: () =>
    ipcRenderer.invoke('monillegence:getLegalDisclaimer') as Promise<string>,
  getVersion: () => ipcRenderer.invoke('monillegence:getVersion') as Promise<string>,
});

export type MonillegenceBridge = {
  getAgentUrl: () => Promise<{ http: string; ws: string }>;
  getLegalDisclaimer: () => Promise<string>;
  getVersion: () => Promise<string>;
};

declare global {
  interface Window {
    monillegence?: MonillegenceBridge;
  }
}
