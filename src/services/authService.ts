import { ENV } from "../types/env";

class AuthService {
  public accessToken: string | null = null;

  async register(email: string, firstName: string, lastName: string) {
    try {
      const response = await fetch(
        `${ENV.API_URL}/o/headless-admin-user/v1.0/user-accounts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Tùy cấu hình Liferay, đôi khi API đăng ký mở không cần token,
            // nhưng nếu yêu cầu, bạn phải dùng Token của một tài khoản Admin.
          },
          body: JSON.stringify({
            emailAddress: email,
            givenName: firstName,
            familyName: lastName,
            // Liferay thường tự gen password và gửi email, hoặc bạn có thể truyền password tùy cấu hình
          }),
        },
      );

      if (response.ok) {
        console.log("Đăng ký thành công!");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Lỗi API Register:", error);
      return false;
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const details: Record<string, string> = {
        grant_type: "password",
        client_id: ENV.CLIENT_ID,
        client_secret: ENV.CLIENT_SECRET,
        username: email,
        password: password,
      };

      const formBody = Object.keys(details)
        .map(
          (key) =>
            encodeURIComponent(key) + "=" + encodeURIComponent(details[key]),
        )
        .join("&");

      // Gọi API lấy token của Liferay
      const response = await fetch(`${ENV.API_URL}/o/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: formBody,
      });

      const data = await response.json();

      if (data.access_token) {
        this.accessToken = data.access_token;
        console.log("Token lấy thành công:", this.accessToken);
        // Mẹo: Bạn nên dùng AsyncStorage để lưu token này lại dùng cho những lần mở app sau
        return true;
      } else {
        console.log("Sai email hoặc mật khẩu");
        return false;
      }
    } catch (error) {
      console.error("Lỗi kết nối API Login:", error);
      return false;
    }
  }

  // Thêm hàm này vào bên trong class AuthService ở trên
  async apiRequest(endpoint: string, options: any = {}) {
    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };

    // Đính kèm token nếu đã đăng nhập
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${ENV.API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Xử lý lỗi 401 khi token hết hạn
    if (response.status === 401) {
      console.warn("Token hết hạn hoặc không hợp lệ. Cần đăng nhập lại!");
      // Code xử lý văng ra màn hình đăng nhập ở đây
    }

    return response.json();
  }
}

export const authService = new AuthService();
