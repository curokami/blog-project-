// src/lib/auth.ts
import { CmsAuthenticationProvider } from "decap-cms-app";

export class CustomAuth implements CmsAuthenticationProvider {
  private auth_url: string;
  private authWindow: Window | null = null;
  private authPromise: ((value: boolean) => void) | null = null;

  constructor(auth_url = "/api/auth") {
    this.auth_url = auth_url;
  }

  // Decap CMSが "Login" ボタンが押されたときに呼び出す
  authenticate = () => {
    this.authPromise = null;
    return new Promise<boolean>((resolve, reject) => {
      this.authPromise = resolve;
      const auth_url = `${this.auth_url}?provider=github&site_id=${
        window.location.host
      }`;
      this.authWindow = window.open(auth_url, "auth", "width=600,height=600");

      // ポップアップからのメッセージを待つ
      window.addEventListener("message", this.authCallback, false);
    });
  };

  // 認証後に呼び出される
  authCallback = (event: MessageEvent) => {
    if (event.data.auth) {
      // 認証成功
      this.authPromise?.(event.data.auth);
      this.cleanup();
    }
  };

  // 認証フローをクリーンアップ
  cleanup = () => {
    if (this.authWindow) {
      this.authWindow.close();
    }
    window.removeEventListener("message", this.authCallback);
  };

  // ユーザー情報を取得（今回はダミーを返す）
  getUser = () => {
    return Promise.resolve({
      name: "User",
      login: "user",
    });
  };

  // ログアウト
  logout = () => {
    return Promise.resolve();
  };

  // トークンを返す（今回はダミー）
  getToken = () => Promise.resolve("");
}