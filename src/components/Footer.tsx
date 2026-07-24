import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { checkForUpdate } from "../lib/updates";
import type { RootState } from "../store";

async function openExternal(url: string) {
  if (window.ragazzi?.openExternal) {
    await window.ragazzi.openExternal(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function Footer() {
  const version = useSelector((state: RootState) => state.system.version);
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
          justifyContent: "space-between",
          alignItems: "flex-end",
          px: 1,
          mb: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {updateUrl && latestVersion ? (
            <Link
              component="button"
              type="button"
              variant="caption"
              underline="hover"
              color="inherit"
              onClick={() => {
                void openExternal(updateUrl);
              }}
              sx={{ cursor: "pointer", verticalAlign: "baseline" }}
            >
              Update available: v{latestVersion}
            </Link>
          ) : null}
        </Typography>
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
            textAlign: "right",
            pr: 1,
            minHeight: 16,
          }}
        >
          v{version}
        </Box>
      </Box>
    </footer>
  );
}
