// security find-identity -vp codesigning
// https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/
require("dotenv").config();
const { notarize } = require("@electron/notarize");

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }

  const appleId = process.env.APPLE_ID;
  const appleIdPassword =
    process.env.APPLE_PASSWORD ||
    process.env.APPLE_APP_SPECIFIC_PASSWORD ||
    process.env.APPLE_APP_PASS;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !teamId) {
    const message =
      "Missing APPLE_ID, APPLE_PASSWORD (or APPLE_APP_PASS), or APPLE_TEAM_ID";
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      throw new Error(`Notarization required in CI: ${message}`);
    }
    console.warn(`Skipping notarization: ${message}`);
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  return await notarize({
    appPath: `${appOutDir}/${appName}.app`,
    appleId,
    appleIdPassword,
    teamId,
  });
};
