// src/lib/cms.ts
import CMS from "decap-cms-app";
import { CustomAuth } from "./auth";
import config from "./config";

export function initCMS() {
  // Use a global flag to prevent re-initialization
  if ((window as any).cmsInitialized) {
    return;
  }
  (window as any).cmsInitialized = true;

  CMS.registerBackend("github", CustomAuth);
  CMS.init({ config });
}