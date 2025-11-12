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
    if (!this.token) {
      return Promise.reject(new Error("Not authenticated"));
    }

    return fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${this.token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => Promise.reject(err));
        }
        return res.json();
      })
      .then((data) => ({
        name: data.name || data.login,
        login: data.login,
        avatar_url: data.avatar_url,
      }));
  };

  logout = () => {
    this.token = null;
    return Promise.resolve();
  };

  // 保存したトークンを返すように修正
  getToken = () => Promise.resolve(this.token);
}