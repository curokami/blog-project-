// src/lib/auth.ts
import type { CmsAuthenticationProvider, CmsUser } from "decap-cms-core";

export class CustomAuth implements CmsAuthenticationProvider {
  private auth_url: string;
  private authWindow: Window | null = null;
  private authPromise: ((value: boolean) => void) | null = null;
  private token: string | null = null;
  private checkClosedInterval: NodeJS.Timeout | null = null; // ウィンドウクローズチェック用のインターバル

  constructor(auth_url = "/api/auth") {
    this.auth_url = auth_url;
  }

  authenticate = () => {
    this.authPromise = null;
    
    // 既存のインターバルをクリア
    if (this.checkClosedInterval) {
      clearInterval(this.checkClosedInterval);
      this.checkClosedInterval = null;
    }
    
    return new Promise<boolean>((resolve, reject) => {
      this.authPromise = resolve;
      
      // 既存のイベントリスナーを削除してから追加
      window.removeEventListener("message", this.authCallback, false);
      window.addEventListener("message", this.authCallback, false);
      
      const auth_url = `${this.auth_url}?provider=github&site_id=${
        window.location.host
      }`;
      
      console.log('Opening auth window:', auth_url);
      this.authWindow = window.open(auth_url, "auth", "width=600,height=600");
      
      if (!this.authWindow) {
        reject(new Error("ポップアップがブロックされました。ポップアップブロッカーを無効にしてください。"));
        return;
      }
      
      // ウィンドウが閉じられた場合の処理
      this.checkClosedInterval = setInterval(() => {
        if (this.authWindow?.closed) {
          if (this.checkClosedInterval) {
            clearInterval(this.checkClosedInterval);
            this.checkClosedInterval = null;
          }
          if (this.authPromise) {
            // ウィンドウが閉じられたが、認証が完了していない場合
            window.removeEventListener("message", this.authCallback, false);
            this.authPromise = null;
            reject(new Error("認証ウィンドウが閉じられました"));
          }
        }
      }, 1000);
    });
  };

  authCallback = (event: MessageEvent) => {
    console.log('Received message event:', {
      origin: event.origin,
      expectedOrigin: window.location.origin,
      data: event.data
    });
    
    // オリジンチェック: 同一オリジンからのメッセージのみ受け付ける
    // Cloudflare Pagesでは、callbackページとadminページは同一オリジンである必要がある
    if (event.origin !== window.location.origin) {
      console.warn(`Ignored message from different origin: ${event.origin} (expected: ${window.location.origin})`);
      return;
    }
    
    // メッセージ形式のチェック
    if (event.data && event.data.type === 'authorization_response' && event.data.payload && event.data.payload.token) {
      // 認証が成功したので、ウィンドウクローズチェックを停止
      if (this.checkClosedInterval) {
        clearInterval(this.checkClosedInterval);
        this.checkClosedInterval = null;
      }
      
      this.token = event.data.payload.token; // トークンを保存
      console.log('Authentication successful, token received');
      
      if (this.authPromise) {
        this.authPromise(true); // 成功(true)を通知
        this.authPromise = null;
      }
      this.cleanup();
    } else {
      console.warn('Invalid message format:', event.data);
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
      console.error("getUser called but no token available");
      return Promise.reject(new Error("Not authenticated"));
    }

    console.log("Fetching user info from GitHub API");
    return fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          console.error("GitHub API error:", res.status, res.statusText);
          return res.json().then((err) => {
            console.error("GitHub API error details:", err);
            return Promise.reject(err);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log("User info retrieved:", data.login);
        return {
          name: data.name || data.login,
          login: data.login,
          avatar_url: data.avatar_url,
        };
      })
      .catch((error) => {
        console.error("Error fetching user info:", error);
        return Promise.reject(error);
      });
  };

  logout = () => {
    this.token = null;
    return Promise.resolve();
  };

  // 保存したトークンを返すように修正
  getToken = () => Promise.resolve(this.token);
}