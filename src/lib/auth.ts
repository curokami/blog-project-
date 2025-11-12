// src/lib/auth.ts
import type { CmsAuthenticationProvider, CmsUser } from "decap-cms-core";

export class CustomAuth implements CmsAuthenticationProvider {
  private auth_url: string;
  private authWindow: Window | null = null;
  private authPromise: ((value: boolean) => void) | null = null;
  private token: string | null = null; // トークンを保存するプロパティを追加

  constructor(auth_url = "/api/auth") {
    this.auth_url = auth_url;
  }

  authenticate = () => {
    this.authPromise = null;
    return new Promise<boolean>((resolve) => {
      this.authPromise = resolve;
      const auth_url = `${this.auth_url}?provider=github&site_id=${
        window.location.host
      }`;
      this.authWindow = window.open(auth_url, "auth", "width=600,height=600");
      window.addEventListener("message", this.authCallback, false);
    });
  };

  authCallback = (event: MessageEvent) => {
    if (event.origin === window.location.origin && event.data.type === 'authorization_response' && event.data.payload) {
      this.token = event.data.payload.token; // トークンを保存
      this.authPromise?.(true); // 成功(true)を通知
      this.cleanup();
    }
  };

  cleanup = () => {
    if (this.authWindow) {
      this.authWindow.close();
    }
    window.removeEventListener("message", this.authCallback);
  };

  getUser = (): Promise<CmsUser> => {
    return Promise.resolve({ name: "User", login: "user" });
  };

  logout = () => {
    this.token = null;
    return Promise.resolve();
  };

  // 保存したトークンを返すように修正
  getToken = () => Promise.resolve(this.token);
}