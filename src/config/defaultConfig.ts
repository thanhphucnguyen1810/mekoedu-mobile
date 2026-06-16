import { IStoreConfig } from "../services/storeConfigService";
import { ENV } from "../types/env";

export const DEFAULT_CONFIG: IStoreConfig = {
  id: 0,
  apiBaseUrl: ENV.API_URL,
  siteId: Number(ENV.SITE_ID),
  channelId: Number(ENV.CHANNEL_ID),
  vocabularyId: Number(ENV.VOCABULARY_ID),
  configCode: "default",
  dateModified: "",
};
