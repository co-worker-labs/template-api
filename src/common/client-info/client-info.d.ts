export interface ClientInfo {
  /**
   * 平台类型 1: ios 2: android 3: h5 4: web
   *默认值: 2
   */
  platformType: number;

  /**
   * app版本, 1.1.1 => 1_001_001
   * 默认值: 1 <= 0.0.1
   */
  appVersion: number;

  /**
   * 设备id
   */
  deviceId?: string;
}
