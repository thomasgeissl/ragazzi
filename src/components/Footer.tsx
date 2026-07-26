import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { checkForUpdate } from "../lib/updates";
import { useSystemStore } from "../stores/system";

async function openExternal(url: string) {
  if (window.ragazzi?.openExternal) {
    await window.ragazzi.openExternal(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function Footer() {
  const version = useSystemStore((state) => state.version);
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    checkForUpdate(version).then((result) => {
      if (cancelled || result.status !== "update-available") return;
      setUpdateUrl(result.releaseUrl);
      setLatestVersion(result.latestVersion);
    });

    return () => {
      cancelled = true;
    };
  }, [version]);

  return (
    <footer style={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "flex-end",
          px: 1,
          mb: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          <i>arrivederci a presto, baciotti.</i>
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
        <Box
          sx={{
            flex: 1,
            bgcolor: "#009246",
            minHeight: 16,
          }}
        />
        <Box sx={{ flex: 1, bgcolor: "#fff", minHeight: 16 }} />
        <Box
          sx={{
            flex: 1,
            bgcolor: "#ce2b37",
            color: "#fff",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1,
            pr: 1,
            minHeight: 16,
            fontSize: "0.75rem",
            lineHeight: 1,
          }}
        >
          <span>v{version}</span>
          {updateUrl && latestVersion ? (
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => {
                void openExternal(updateUrl);
              }}
              sx={{
                cursor: "pointer",
                color: "inherit",
                fontSize: "inherit",
                lineHeight: "inherit",
                p: 0,
                border: 0,
                background: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.25,
              }}
            >
              update available (v{latestVersion})
              <OpenInNewIcon sx={{ fontSize: "0.85em" }} />
            </Link>
          ) : null}
        </Box>
      </Box>
    </footer>
  );
}
