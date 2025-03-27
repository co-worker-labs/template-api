import { v4 as uuidV4 } from 'uuid';

export function genUUID() {
  return uuidV4();
}

export function jsonStringifyReplacer(key: string, value: any): any {
  if (value === null) {
    return undefined;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

export function object2Str(payload: any): string {
  return Buffer.from(JSON.stringify(payload, jsonStringifyReplacer)).toString(
    'base64',
  );
}

export function str2Object(str: string): any {
  return JSON.parse(Buffer.from(str, 'base64').toString());
}

export function arraySize(list: any[]): number {
  return list ? list.length : 0;
}

export function mapSize(map: Map<any, any>): number {
  return map ? map.size : 0;
}

export function isEmptyArray(list: any[]): boolean {
  return arraySize(list) === 0;
}

export function isEmptyMap(map: Map<any, any>): boolean {
  return mapSize(map) === 0;
}
