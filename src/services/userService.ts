import { api } from "./api";
import type { LiferayUserInfo } from "./liferayService";

class UserService {
  async getMyUserInfo(): Promise<LiferayUserInfo | null> {
    try {
      const res = await api.get<LiferayUserInfo>(
        "/o/headless-admin-user/v1.0/my-user-account",
      );

      return res.data;
    } catch (e) {
      console.warn("getMyUserInfo failed:", e);
      return null;
    }
  }
}

export default new UserService();
