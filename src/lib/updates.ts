export const GITHUB_REPO = "thomasgeissl/ragazzi";
export const RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;
export const LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export type UpdateCheckResult =
  | {
      status: "up-to-date";
      currentVersion: string;
      latestVersion: string;
      releaseUrl: string;
    }
  | {
      status: "update-available";
      currentVersion: string;
      latestVersion: string;
      releaseUrl: string;
    }
  | {
      status: "error";
      currentVersion: string;
      releaseUrl: string;
      error: string;
    };

export function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, "");
}

function parseVersionParts(version: string): number[] {
  return normalizeVersion(version)
    .split(/[.+-]/)
    .map((part) => {
      const value = Number.parseInt(part, 10);
      return Number.isFinite(value) ? value : 0;
    });
}

/** Returns true when `latest` is strictly newer than `current`. */
export function isNewerVersion(latest: string, current: string): boolean {
  const latestParts = parseVersionParts(latest);
  const currentParts = parseVersionParts(current);
  const length = Math.max(latestParts.length, currentParts.length);

  for (let i = 0; i < length; i += 1) {
    const a = latestParts[i] ?? 0;
    const b = currentParts[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

type GithubRelease = {
  tag_name?: string;
  html_url?: string;
};

export async function checkForUpdate(
  currentVersion: string,
  fetchImpl: typeof fetch = fetch,
): Promise<UpdateCheckResult> {
  const releaseUrl = RELEASES_URL;
  const current = normalizeVersion(currentVersion);

  try {
    const response = await fetchImpl(LATEST_RELEASE_API, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "ragazzi-update-checker",
      },
    });

    if (!response.ok) {
      return {
        status: "error",
        currentVersion: current,
        releaseUrl,
        error: `GitHub returned ${response.status}`,
      };
    }

    const data = (await response.json()) as GithubRelease;
    const latest = normalizeVersion(data.tag_name ?? "");
    if (!latest) {
      return {
        status: "error",
        currentVersion: current,
        releaseUrl,
        error: "Latest release has no tag",
      };
    }

    const htmlUrl =
      typeof data.html_url === "string" && data.html_url.startsWith("https://")
        ? data.html_url
        : releaseUrl;

    if (isNewerVersion(latest, current)) {
      return {
        status: "update-available",
        currentVersion: current,
        latestVersion: latest,
        releaseUrl: htmlUrl,
      };
    }

    return {
      status: "up-to-date",
      currentVersion: current,
      latestVersion: latest,
      releaseUrl: htmlUrl,
    };
  } catch (err) {
    return {
      status: "error",
      currentVersion: current,
      releaseUrl,
      error: err instanceof Error ? err.message : "Could not check for updates",
    };
  }
}
