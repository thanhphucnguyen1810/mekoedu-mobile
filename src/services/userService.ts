import { api } from "./api";

export interface AccountBrief {
  id: number;
  name: string;
}

export interface UserInfo {
  id: number;
  name: string;
  givenName: string;
  familyName: string;
  emailAddress: string;
  alternateName: string;
  image?: string;

  accountBriefs?: AccountBrief[];
}

class UserService {
  async getMyUserInfo(): Promise<UserInfo | null> {
    try {
      const res = await api.get<UserInfo>(
        "/o/headless-admin-user/v1.0/my-user-account",
      );

      return res.data;
    } catch (error: any) {
      console.error(
        "getMyUserInfo failed:",
        error.response?.data || error.message,
      );
      return null;
    }
  }

  async getUserById(userId: number): Promise<UserInfo | null> {
    try {
      const res = await api.get<UserInfo>(
        `/o/headless-admin-user/v1.0/user-accounts/${userId}`,
      );

      return res.data;
    } catch (error: any) {
      console.error(
        "getUserById failed:",
        error.response?.data || error.message,
      );
      return null;
    }
  }

  async getCurrentAccountId(): Promise<number | null> {
    try {
      const user = await this.getMyUserInfo();

      return user?.accountBriefs?.[0]?.id ?? null;
    } catch (error: any) {
      console.error(
        "getCurrentAccountId failed:",
        error.response?.data || error.message,
      );
      return null;
    }
  }
}

export default new UserService();
