import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const BASE_URL = extra.LIFERAY_BASE_URL ?? 'http://192.168.2.152:8080';
export const CLIENT_ID = extra.LIFERAY_CLIENT_ID ?? 'id-2a5344c9-dfb3-92b3-e5fd-ecb50b73536';
export const CLIENT_SECRET = extra.LIFERAY_CLIENT_SECRET ?? 'secret-7f2d4270-6b84-de1d-68d2-7c4e430d965';
export const CHANNEL_ID = extra.LIFERAY_CHANNEL_ID ?? '33290';
export const SITE_ID = extra.LIFERAY_SITE_ID ?? '20117';
