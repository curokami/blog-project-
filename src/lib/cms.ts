// src/lib/cms.ts
import CMS from "decap-cms-app";
import { CustomAuth } from "./auth";
import config from "./config";

let initialized = false;

export function initCMS() {
  if (initialized) {
    return;
  }
  initialized = true;

  CMS.registerBackend("github", CustomAuth);
  CMS.init({ config });
}