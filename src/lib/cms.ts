// src/lib/cms.ts
import CMS from "decap-cms-app";
import { CustomAuth } from "./auth";
import config from "./config";

/**
 * The initCMS function is removed and the initialization logic is moved to the top level.
 * This ensures that the code is executed only once when the module is first imported,
 * providing the most robust guard against re-initialization issues.
 */
CMS.registerBackend("github", CustomAuth);
CMS.init(config);