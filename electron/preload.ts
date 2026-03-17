import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // Add your API here
});
