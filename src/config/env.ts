export const ENV = {
  API_URL:       process.env.EXPO_PUBLIC_API_URL       ?? "http://192.168.2.152:8080",

  /** OAuth2 Application credentials */
  CLIENT_ID:     process.env.EXPO_PUBLIC_CLIENT_ID     ?? "",
  CLIENT_SECRET: process.env.EXPO_PUBLIC_CLIENT_SECRET ?? "",

  /** Liferay Commerce Channel ID */
  CHANNEL_ID:    process.env.EXPO_PUBLIC_CHANNEL_ID    ?? "",

  /** Liferay Site ID (dùng cho Taxonomy, Structured Content…) */
  SITE_ID:       process.env.EXPO_PUBLIC_SITE_ID       ?? "",

  /** Taxonomy Vocabulary ID cho Categories */
  VOCABULARY_ID: process.env.EXPO_PUBLIC_VOCABULARY_ID   ?? "",
  // VOCABULARY_ID: "32451",
} as const;

export type EnvKeys = keyof typeof ENV;
