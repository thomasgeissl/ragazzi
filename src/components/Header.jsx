import React from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

export default () => {
  const version = useSelector((state) => state.system.version);
  const location = useLocation();
  return (
    <Box>
      <Grid
        container
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Grid>
          {location.pathname !== "/" && (
            <Link to="/">
              <Typography>
                <ArrowBackIcon />
              </Typography>
            </Link>
          )}
        </Grid>
        <Grid>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            v {version}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};
