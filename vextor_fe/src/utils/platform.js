import { Capacitor } from '@capacitor/core';

/**
 * Utility for detecting native platform environment (Capacitor / Android APK)
 */
export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = () => {
  return Capacitor.getPlatform();
};

export const isAndroidApp = () => {
  return Capacitor.getPlatform() === 'android';
};
