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
import { encodePayload, type PayloadEncoding } from "../lib/payload";
import { publishMessage } from "../mqtt";

const EMPTY_JSON: Record<string, unknown> = {};
type PayloadFormat = PayloadEncoding | "json";

export default function Publisher() {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [jsonData, setJsonData] = useState<unknown>(EMPTY_JSON);
  const [format, setFormat] = useState<PayloadFormat>("json");
  const [payloadError, setPayloadError] = useState("");
  function payloadForPublish() {
    if (format === "json") {
      return encodePayload(JSON.stringify(jsonData), "utf8");
    }
    return encodePayload(message, format);
  }

  function handleClick(nextTopic: string) {
    try {
      const payload = payloadForPublish();
      setPayloadError("");
      publishMessage(nextTopic, payload.message, payload.encoding);
    } catch (error) {
      setPayloadError(error instanceof Error ? error.message : "Payload could not be encoded.");
    }
  }

  function handleFormatChange(_: React.MouseEvent<HTMLElement>, next: PayloadFormat | null) {
    if (!next) return;

    if (next === "json" && format !== "json") {
      try {
        const parsed = message.trim() ? JSON.parse(message) : EMPTY_JSON;
        setJsonData(parsed);
      } catch {
        setJsonData(EMPTY_JSON);
      }
    } else if (next !== "json" && format === "json") {
      setMessage("");
    }

    setPayloadError("");
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
            <ToggleButton value="json">json</ToggleButton>
            <ToggleButton value="utf8">UTF-8</ToggleButton>
            <ToggleButton value="hex">hex</ToggleButton>
            <ToggleButton value="base64">base64</ToggleButton>
            <ToggleButton value="uint8">byte</ToggleButton>
          </ToggleButtonGroup>
          {format !== "json" ? (
            <TextField
              fullWidth
              size="small"
              multiline
              label={format === "uint8" ? "byte value" : "message"}
              value={message}
              helperText={
                payloadError ||
                (format === "hex"
                  ? "Byte pairs, optionally separated by spaces (for example, 7f 00 ff)."
                  : format === "base64"
                    ? "Base64-encoded bytes (for example, fw==)."
                    : format === "uint8"
                      ? "One decimal byte from 0 through 255 (for example, 127 sends 0x7f)."
                      : undefined)
              }
              error={Boolean(payloadError)}
              onChange={(event) => {
                setMessage(event.target.value);
                setPayloadError("");
              }}
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
