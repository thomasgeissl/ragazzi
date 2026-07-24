import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useSelector } from "react-redux";

export default () => {
  const version = useSelector((state) => state.system.version);

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
        <Typography variant="caption" color="text.secondary" />
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
};
