import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { JsonEditor } from "json-edit-react";
import type React from "react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { getClient } from "../mqtt";
import { addSentMessage } from "../store/reducers/mqtt";

const EMPTY_JSON: Record<string, unknown> = {};

export default function Publisher() {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [jsonData, setJsonData] = useState<unknown>(EMPTY_JSON);
  const [format, setFormat] = useState<"raw" | "json">("raw");
  const dispatch = useDispatch();

  function payloadForPublish() {
    if (format === "json") {
      return JSON.stringify(jsonData);
    }
    return message;
  }

  function handleClick(nextTopic: string) {
    const payload = payloadForPublish();
    dispatch(addSentMessage(nextTopic, payload));
    return getClient().publish(nextTopic, payload);
  }

  function handleFormatChange(_: React.MouseEvent<HTMLElement>, next: "raw" | "json" | null) {
    if (!next) return;

    if (next === "json" && format === "raw") {
      try {
        const parsed = message.trim() ? JSON.parse(message) : EMPTY_JSON;
        setJsonData(parsed);
      } catch {
        setJsonData(EMPTY_JSON);
      }
    } else if (next === "raw" && format === "json") {
      setMessage(JSON.stringify(jsonData, null, 2));
    }

    setFormat(next);
  }

  return (
    <Accordion defaultExpanded sx={{ width: "100%" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography component="h3" variant="h6">
          publish
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 1, pb: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            label="topic"
            size="small"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />
          <ToggleButtonGroup
            exclusive
            size="small"
            value={format}
            onChange={handleFormatChange}
            aria-label="message format"
            sx={{
              alignSelf: "flex-start",
              "& .MuiToggleButton-root": {
                px: 1,
                py: 0,
                fontSize: "0.7rem",
                lineHeight: 1.5,
                textTransform: "none",
              },
            }}
          >
            <ToggleButton value="raw">raw</ToggleButton>
            <ToggleButton value="json">json</ToggleButton>
          </ToggleButtonGroup>
          {format === "raw" ? (
            <TextField
              fullWidth
              size="small"
              multiline
              label="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleClick(topic);
                }
              }}
            />
          ) : (
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                overflow: "auto",
                maxHeight: 360,
                "& .jer-editor-container": { fontSize: "0.875rem" },
              }}
            >
              <JsonEditor
                data={jsonData}
                setData={setJsonData}
                rootName="message"
                minWidth="100%"
                maxWidth="100%"
              />
            </Box>
          )}
          <Box>
            <Button
              variant="contained"
              color="primary"
              type="button"
              onClick={() => handleClick(topic)}
            >
              publish
            </Button>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
