import { RigsmithApp } from "../App";

/**
 * The mounted controller, or null before mount. WebMCP tool handlers use this
 * to read and mutate the same build the shopper sees.
 */
export const getRigsmithApp = (): RigsmithApp | null => RigsmithApp.instance;

/** Same, but throws — for handlers that cannot do anything useful without it. */
export function requireRigsmithApp(): RigsmithApp {
  const app = RigsmithApp.instance;
  if (!app) throw new Error("Rigsmith is not mounted yet.");
  return app;
}
