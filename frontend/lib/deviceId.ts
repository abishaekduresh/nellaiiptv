const DEVICE_UUID_KEY = 'nellai_device_uuid';

export function getDeviceUUID(): string {
  if (typeof window === 'undefined') return '';
  
  let deviceUUID = localStorage.getItem(DEVICE_UUID_KEY);
  
  if (!deviceUUID) {
    // Generate a simple UUID using crypto API
    deviceUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    localStorage.setItem(DEVICE_UUID_KEY, deviceUUID);
  }
  
  return deviceUUID;
}
