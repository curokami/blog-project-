// src/lib/cms.ts
import CMS from "decap-cms-app";
import { CustomAuth } from "./auth";
import config from "./config";

/**
 * Decap CMSを初期化する
 * DOMContentLoadedを待ってから実行することで、DOM要素が確実に存在することを保証
 */
function initCMS() {
  try {
    // カスタムバックエンドを登録
CMS.registerBackend("github", CustomAuth);
    
    // CMSを初期化
    CMS.init({ config });
    
    console.log("Decap CMS initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Decap CMS:", error);
  }
}

// DOMが読み込まれた後に初期化
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCMS);
  } else {
    // 既にDOMが読み込まれている場合
    initCMS();
  }
}