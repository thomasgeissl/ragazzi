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
import { JsonEditor, type TextEditorProps } from "json-edit-react";
import JSON5 from "json5";
import type React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
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
  const [jsonInputError, setJsonInputError] = useState(false);
  const editingJsonRoot = useRef(true);
  const onJsonTextChange = useRef<(value: string) => void>(() => {});
  const jsonEditorTriggers = useMemo(() => ({ edit: { path: [] } }), []);
  const JsonTextEditor = useMemo(
    () =>
      function JsonTextEditor({ value, onChange, onKeyDown }: TextEditorProps) {
        const dummyValue = value.endsWith("\n") ? `${value}.` : value;

        return (
          <Box sx={{ display: "grid" }}>
            <textarea
              className="jer-collection-text-area"
              rows={1}
              style={{
                gridArea: "1 / 1 / 2 / 2",
                height: "auto",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
              }}
              value={value}
              onChange={(event) => {
                const nextValue = event.target.value;
                onChange(nextValue);
                onJsonTextChange.current(nextValue);
              }}
              onFocus={(event) => {
                if (value.length < 40) event.target.select();
              }}
              onKeyDown={onKeyDown}
            />
            <span
              className="jer-collection-text-area"
              style={{
                border: "1px solid transparent",
                gridArea: "1 / 1 / 2 / 2",
                height: "auto",
                overflowY: "auto",
                visibility: "hidden",
                whiteSpace: "pre-wrap",
              }}
            >
              {dummyValue}
            </span>
          </Box>
        );
      },
    [],
  );

  const saveJsonText = useCallback((value: string) => {
    if (!editingJsonRoot.current) return;

    try {
      const parsed = JSON5.parse(value);
      setJsonData(parsed);
      setJsonInputError(false);
    } catch {
      setJsonInputError(true);
    }
  }, []);

  onJsonTextChange.current = saveJsonText;

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
        const parsed = message.trim() ? JSON5.parse(message) : EMPTY_JSON;
        setJsonData(parsed);
      } catch {
        setJsonData(EMPTY_JSON);
      }
    } else if (next !== "json" && format === "json") {
      setMessage("");
    }

    setPayloadError("");
    setJsonInputError(false);
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
                "& .jer-collection-text-edit": { minWidth: 0, width: "100%" },
                "& .jer-collection-text-area": {
                  boxSizing: "border-box",
                  maxWidth: "100%",
                  resize: "vertical",
                  width: "100%",
                },
                "& .jer-collection-input-button-row": {
                  justifyContent: "flex-start",
                  width: "auto",
                },
              }}
            >
              <JsonEditor
                data={jsonData}
                setData={setJsonData}
                rootName="message"
                indent={2}
                minWidth="100%"
                maxWidth="100%"
                externalTriggers={jsonEditorTriggers}
                jsonParse={JSON5.parse}
                TextEditor={JsonTextEditor}
                onError={({ error }) => {
                  if (error.code === "INVALID_JSON") setJsonInputError(true);
                }}
                onUpdate={() => setJsonInputError(false)}
                onEditEvent={(path) => {
                  editingJsonRoot.current = path?.length === 0;
                  if (!path) {
                    setJsonInputError(false);
                  }
                }}
              />
            </Box>
          )}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              type="button"
              disabled={format === "json" && jsonInputError}
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
