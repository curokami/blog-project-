// src/lib/auth.ts
import type { CmsAuthenticationProvider } from "decap-cms-core";

export class CustomAuth implements CmsAuthenticationProvider {
  private auth_url: string;
  private authWindow: Window | null = null;
  private authPromise: ((value: boolean) => void) | null = null;

  constructor(auth_url = "/api/auth") {
    this.auth_url = auth_url;
  }

  authenticate = () => {
    this.authPromise = null;
    return new Promise<boolean>((resolve, reject) => {
      this.authPromise = resolve;
      const auth_url = `${this.auth_url}?provider=github&site_id=${
        window.location.host
      }`;
      this.authWindow = window.open(auth_url, "auth", "width=600,height=600");
      window.addEventListener("message", this.authCallback, false);
    });
  };

  authCallback = (event: MessageEvent) => {
    // Add origin check for security and check for the specific message type
    if (event.origin === window.location.origin && event.data.type === 'authorization_response' && event.data.payload) {
      this.authPromise?.(event.data.payload);
      this.cleanup();
    }
  };

  cleanup = () => {
    if (this.authWindow) {
      this.authWindow.close();
    }
    window.removeEventListener("message", this.authCallback);
  };

  getUser = () => Promise.resolve({ name: "User", login: "user" });
  logout = () => Promise.resolve();
  getToken = () => Promise.resolve("");
}