// src/lib/cms.ts
import CMS from "decap-cms-app";
import { CustomAuth } from "./auth";
import config from "./config";

export function initCMS() {
  CMS.registerBackend("github", CustomAuth);
  CMS.init({ config });
}