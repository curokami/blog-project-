// src/lib/cms.ts
import CMS from "decap-cms-app";
import { CustomAuth } from "./auth";
import config from "../../public/admin/config.yml";

export function initCMS() {
  // カスタム認証プロバイダーを登録
  CMS.registerAuthenticationProvider(new CustomAuth());

  // CMSを初期化
  CMS.init({ config });
}