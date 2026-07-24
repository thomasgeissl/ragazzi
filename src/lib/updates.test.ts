import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkForUpdate,
  isNewerVersion,
  LATEST_RELEASE_API,
  normalizeVersion,
  RELEASES_URL,
} from "./updates";

describe("normalizeVersion", () => {
  it("strips a leading v", () => {
    expect(normalizeVersion("v1.2.3")).toBe("1.2.3");
    expect(normalizeVersion("V0.9.2")).toBe("0.9.2");
  });

  it("trims whitespace", () => {
    expect(normalizeVersion(" 1.0.0 ")).toBe("1.0.0");
  });
});

describe("isNewerVersion", () => {
  it("detects newer major/minor/patch", () => {
    expect(isNewerVersion("1.0.0", "0.9.2")).toBe(true);
    expect(isNewerVersion("0.10.0", "0.9.2")).toBe(true);
    expect(isNewerVersion("0.9.3", "0.9.2")).toBe(true);
  });

  it("returns false when equal or older", () => {
    expect(isNewerVersion("0.9.2", "0.9.2")).toBe(false);
    expect(isNewerVersion("0.9.1", "0.9.2")).toBe(false);
    expect(isNewerVersion("v0.9.2", "0.9.2")).toBe(false);
  });

  it("handles unequal part lengths", () => {
    expect(isNewerVersion("1.0", "1.0.0")).toBe(false);
    expect(isNewerVersion("1.0.1", "1.0")).toBe(true);
  });
});

describe("checkForUpdate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports update-available for a newer release", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: "v0.10.0",
        html_url: "https://github.com/thomasgeissl/ragazzi/releases/tag/v0.10.0",
      }),
    });

    await expect(checkForUpdate("0.9.2", fetchImpl)).resolves.toEqual({
      status: "update-available",
      currentVersion: "0.9.2",
      latestVersion: "0.10.0",
      releaseUrl: "https://github.com/thomasgeissl/ragazzi/releases/tag/v0.10.0",
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      LATEST_RELEASE_API,
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/vnd.github+json",
        }),
      }),
    );
  });

  it("reports up-to-date when versions match", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: "0.9.2",
        html_url: "https://github.com/thomasgeissl/ragazzi/releases/tag/0.9.2",
      }),
    });

    await expect(checkForUpdate("v0.9.2", fetchImpl)).resolves.toEqual({
      status: "up-to-date",
      currentVersion: "0.9.2",
      latestVersion: "0.9.2",
      releaseUrl: "https://github.com/thomasgeissl/ragazzi/releases/tag/0.9.2",
    });
  });

  it("reports error on non-OK responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    });

    await expect(checkForUpdate("0.9.2", fetchImpl)).resolves.toEqual({
      status: "error",
      currentVersion: "0.9.2",
      releaseUrl: RELEASES_URL,
      error: "GitHub returned 403",
    });
  });

  it("reports error when fetch throws", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));

    await expect(checkForUpdate("0.9.2", fetchImpl)).resolves.toEqual({
      status: "error",
      currentVersion: "0.9.2",
      releaseUrl: RELEASES_URL,
      error: "offline",
    });
  });
});
