import { Buffer } from "node:buffer";
import styled from "@emotion/styled";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import CloseIcon from "@mui/icons-material/Close";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import DownloadIcon from "@mui/icons-material/Download";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import StopIcon from "@mui/icons-material/Stop";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { format } from "date-fns";
import compare from "date-fns/compareDesc";
import { useEffect, useRef, useState } from "react";
import { createHistoryFile, parseHistoryFile } from "../lib/history";
import { encodePayload, type PayloadEncoding } from "../lib/payload";
import { type ReplayController, replayMessages } from "../lib/replay";
import { publishMessage } from "../mqtt";
import { type MessageType, type MqttMessage, useMqttStore } from "../stores/mqtt";
import Subscriber from "./Subscriber";
import Subscriptions from "./Subscriptions";

const StyledTable = styled(Table)`
  overflow-wrap: break-word;
`;

type MessageRepresentation = PayloadEncoding | "json";

const representationLabels: Record<MessageRepresentation, string> = {
  utf8: "UTF-8",
  hex: "hex",
  base64: "base64",
  uint8: "byte",
  json: "JSON",
};

const globalRepresentationOptions: PayloadEncoding[] = ["utf8", "hex", "base64", "uint8"];

function messagePayload(message: MqttMessage): Buffer {
  const encoded = encodePayload(message.message, message.encoding);
  return typeof encoded.payload === "string"
    ? Buffer.from(encoded.payload, "utf8")
    : encoded.payload;
}

function canRepresentAsJson(message: MqttMessage): boolean {
  try {
    JSON.parse(messagePayload(message).toString("utf8"));
    return true;
  } catch {
    return false;
  }
}

function representMessage(message: MqttMessage, representation: MessageRepresentation): string {
  const payload = messagePayload(message);

  switch (representation) {
    case "utf8":
      return payload.toString("utf8");
    case "hex":
      return payload.toString("hex");
    case "base64":
      return payload.toString("base64");
    case "uint8":
      return Array.from(payload.values()).join(" ");
    case "json":
      return JSON.stringify(JSON.parse(payload.toString("utf8")), null, 2);
  }
}

export default function Logger() {
  const receivedMessages = useMqttStore((state) => state.receivedMessages);
  const sentMessages = useMqttStore((state) => state.sentMessages);
  const historyTabs = useMqttStore((state) => state.historyTabs);
  const showSubscriptions = useMqttStore((state) => state.subscriptions.size > 0);
  const clearMessages = useMqttStore((state) => state.clearMessages);
  const saveHistoryTab = useMqttStore((state) => state.saveHistoryTab);
  const importHistoryTab = useMqttStore((state) => state.importHistoryTab);
  const renameHistoryTab = useMqttStore((state) => state.renameHistoryTab);
  const deleteHistoryTab = useMqttStore((state) => state.deleteHistoryTab);
  const [selectedTab, setSelectedTab] = useState("live");
  const [renamingTab, setRenamingTab] = useState<{ id: string; title: string }>();
  const [replayInProgress, setReplayInProgress] = useState(false);
  const [replayDirection, setReplayDirection] = useState<MessageType>("INCOMING");
  const [replayProgress, setReplayProgress] = useState<{ completed: number; total: number }>();
  const [historyFileError, setHistoryFileError] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [globalRepresentationAnchor, setGlobalRepresentationAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [globalRepresentation, setGlobalRepresentation] = useState<PayloadEncoding | null>(null);
  const [representations, setRepresentations] = useState<Map<string, MessageRepresentation>>(
    () => new Map(),
  );
  const replayRef = useRef<ReplayController>();
  const liveMessages = [...receivedMessages, ...sentMessages].sort((a, b) =>
    compare(a.timestamp, b.timestamp),
  );
  const selectedHistoryTab = historyTabs.find((historyTab) => historyTab.id === selectedTab);
  const messages = selectedHistoryTab?.messages ?? liveMessages;

  useEffect(() => {
    if (selectedTab !== "live" && !selectedHistoryTab) {
      setSelectedTab("live");
    }
  }, [selectedHistoryTab, selectedTab]);

  useEffect(
    () => () => {
      replayRef.current?.cancel();
    },
    [],
  );

  function handleSaveHistory() {
    const id = saveHistoryTab();
    if (id) setSelectedTab(id);
  }

  async function handleExportHistory() {
    if (!window.ragazzi?.history) {
      setHistoryFileError("History file access is unavailable.");
      return;
    }

    try {
      const title = selectedHistoryTab?.title ?? "Live history";
      await window.ragazzi.history.export(
        JSON.stringify(createHistoryFile(title, messages), null, 2),
        `${title.replace(/[^\w.-]+/g, "-").toLowerCase()}.json`,
      );
      setHistoryFileError("");
    } catch (error) {
      setHistoryFileError(error instanceof Error ? error.message : "History export failed.");
    }
  }

  async function handleImportHistory() {
    if (!window.ragazzi?.history) {
      setHistoryFileError("History file access is unavailable.");
      return;
    }

    try {
      const contents = await window.ragazzi.history.import();
      if (!contents) return;

      const id = importHistoryTab(parseHistoryFile(contents));
      setHistoryFileError("");
      setSelectedTab(id);
    } catch (error) {
      setHistoryFileError(error instanceof Error ? error.message : "History import failed.");
    }
  }

  function stopReplay() {
    replayRef.current?.cancel();
    replayRef.current = undefined;
    setReplayInProgress(false);
    setReplayProgress(undefined);
  }

  function startReplay() {
    const messagesToReplay = selectedHistoryTab?.messages.filter(
      (message) => message.type === replayDirection,
    );
    if (!selectedHistoryTab || !messagesToReplay?.length) return;

    stopReplay();
    setReplayInProgress(true);
    setReplayProgress({ completed: 0, total: messagesToReplay.length });
    replayRef.current = replayMessages(
      messagesToReplay,
      (message) => publishMessage(message.topic, message.message, message.encoding),
      () => {
        replayRef.current = undefined;
        setReplayInProgress(false);
      },
      (completed, total) => setReplayProgress({ completed, total }),
    );
  }

  function closeHistoryTab(id: string) {
    if (selectedTab === id) {
      stopReplay();
      setSelectedTab("live");
    }
    deleteHistoryTab(id);
  }

  function finishRenamingTab() {
    if (!renamingTab) return;
    renameHistoryTab(renamingTab.id, renamingTab.title);
    setRenamingTab(undefined);
  }

  function setLineRepresentation(message: MqttMessage, representation: MessageRepresentation | "") {
    setRepresentations((current) => {
      const next = new Map(current);
      if (representation) {
        next.set(message.id, representation);
      } else {
        next.delete(message.id);
      }
      return next;
    });
  }

  function setGlobalMessageRepresentation(representation: PayloadEncoding | null) {
    setGlobalRepresentation(representation);
    setGlobalRepresentationAnchor(null);
  }

  return (
    <Accordion defaultExpanded sx={{ width: "100%" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography component="h3" variant="h6">
          subscribe
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 1, pb: 2, width: "100%", boxSizing: "border-box" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
          <Subscriber />
          {showSubscriptions && <Subscriptions />}
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            width: "100%",
            mb: 2,
            boxSizing: "border-box",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TextField
              fullWidth
              label="filter"
              size="small"
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
            />
          </Box>
          <Tooltip title="import history">
            <IconButton
              color="primary"
              type="button"
              aria-label="import history"
              onClick={() => void handleImportHistory()}
            >
              <UploadFileIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="export current history">
            <span>
              <IconButton
                color="primary"
                type="button"
                aria-label="export current history"
                disabled={messages.length === 0}
                onClick={() => void handleExportHistory()}
              >
                <DownloadIcon />
              </IconButton>
            </span>
          </Tooltip>
          {selectedTab === "live" ? (
            <>
              <Tooltip title="save history">
                <span>
                  <IconButton
                    color="primary"
                    type="button"
                    aria-label="save history"
                    disabled={liveMessages.length === 0}
                    onClick={handleSaveHistory}
                  >
                    <SaveIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="clear live history">
                <IconButton
                  color="primary"
                  type="button"
                  aria-label="clear live history"
                  onClick={clearMessages}
                >
                  <DeleteSweepIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={replayDirection}
                disabled={replayInProgress}
                onChange={(_, nextDirection: MessageType | null) => {
                  if (nextDirection) setReplayDirection(nextDirection);
                }}
                sx={{ flexShrink: 0 }}
              >
                <ToggleButton
                  value="INCOMING"
                  disabled={
                    !selectedHistoryTab?.messages.some((message) => message.type === "INCOMING")
                  }
                >
                  incoming
                </ToggleButton>
                <ToggleButton
                  value="OUTGOING"
                  disabled={
                    !selectedHistoryTab?.messages.some((message) => message.type === "OUTGOING")
                  }
                >
                  outgoing
                </ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="contained"
                type="button"
                startIcon={<PlayArrowIcon />}
                disabled={
                  replayInProgress ||
                  !selectedHistoryTab?.messages.some((message) => message.type === replayDirection)
                }
                onClick={startReplay}
                sx={{ flexShrink: 0 }}
              >
                replay
              </Button>
              {replayInProgress && replayProgress && (
                <Typography variant="caption" sx={{ whiteSpace: "nowrap" }}>
                  Replaying {replayDirection.toLowerCase()} · {replayProgress.completed} /{" "}
                  {replayProgress.total}
                </Typography>
              )}
              <Button
                variant="outlined"
                type="button"
                startIcon={<StopIcon />}
                disabled={!replayInProgress}
                onClick={stopReplay}
                sx={{ flexShrink: 0 }}
              >
                stop
              </Button>
            </>
          )}
        </Box>
        {historyFileError && (
          <Typography color="error" variant="caption">
            {historyFileError}
          </Typography>
        )}
        <Tabs
          value={selectedTab}
          onChange={(_, nextTab: string) => {
            stopReplay();
            setSelectedTab(nextTab);
          }}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Message history tabs"
          sx={{ mb: 1 }}
        >
          <Tab value="live" label="live" />
          {historyTabs.map((historyTab) => {
            const closeTab = () => closeHistoryTab(historyTab.id);
            return (
              <Tab
                key={historyTab.id}
                value={historyTab.id}
                onClick={() => {
                  if (selectedTab === historyTab.id) {
                    setRenamingTab({ id: historyTab.id, title: historyTab.title });
                  }
                }}
                label={
                  renamingTab?.id === historyTab.id ? (
                    <TextField
                      autoFocus
                      size="small"
                      value={renamingTab.title}
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        setRenamingTab({ id: historyTab.id, title: event.target.value })
                      }
                      onBlur={finishRenamingTab}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          finishRenamingTab();
                        } else if (event.key === "Escape") {
                          event.preventDefault();
                          setRenamingTab(undefined);
                        }
                      }}
                      slotProps={{ input: { "aria-label": "History tab name" } }}
                      sx={{ width: 180 }}
                    />
                  ) : (
                    <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
                      {historyTab.title}
                      <Box
                        component="span"
                        role="button"
                        tabIndex={0}
                        aria-label={`Close ${historyTab.title}`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          closeTab();
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            closeTab();
                          }
                        }}
                        sx={{ display: "flex", "&:hover": { color: "error.main" } }}
                      >
                        <CloseIcon fontSize="small" />
                      </Box>
                    </Box>
                  )
                }
              />
            );
          })}
        </Tabs>
        <TableContainer component={Paper} sx={{ overflow: "auto", width: "100%" }} elevation={0}>
          <StyledTable size="small">
            <TableHead>
              <TableRow>
                <TableCell width="10%">
                  <b>Direction</b>
                </TableCell>
                <TableCell width="40%">
                  <b>Topic</b>
                </TableCell>
                <TableCell width="40%">
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      "&:hover .global-representation-control, &:focus-within .global-representation-control":
                        { opacity: 1 },
                    }}
                  >
                    <b>Message</b>
                    <Button
                      className="global-representation-control"
                      size="small"
                      type="button"
                      color="inherit"
                      endIcon={<ExpandMoreIcon fontSize="small" />}
                      aria-label="Change representation for all messages"
                      onClick={(event) => setGlobalRepresentationAnchor(event.currentTarget)}
                      sx={{
                        fontSize: "0.625rem",
                        minWidth: 0,
                        opacity: 0,
                        p: 0,
                        textTransform: "none",
                      }}
                    >
                      {globalRepresentation
                        ? `all: ${representationLabels[globalRepresentation]}`
                        : "all: original"}
                    </Button>
                  </Box>
                </TableCell>
                <TableCell width="15%">
                  <b>Timestamp</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {messages
                .filter((message) => topicFilter === "" || message.topic.includes(topicFilter))
                .map((message) => {
                  const hasOverride = representations.has(message.id);
                  const representation =
                    representations.get(message.id) ?? globalRepresentation ?? message.encoding;
                  return (
                    <TableRow key={message.id}>
                      <TableCell>
                        {message.type === "INCOMING" ? (
                          <Tooltip title="incoming">
                            <CallReceivedIcon />
                          </Tooltip>
                        ) : (
                          <Tooltip title="outgoing">
                            <SendIcon
                              onClick={() => {
                                if (selectedTab === "live") {
                                  publishMessage(message.topic, message.message, message.encoding);
                                }
                              }}
                              style={{ cursor: selectedTab === "live" ? "pointer" : "default" }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>{message.topic}</TableCell>
                      <TableCell>
                        <Select
                          value={hasOverride ? representation : ""}
                          displayEmpty
                          variant="standard"
                          aria-label={`Representation for ${message.topic}`}
                          onChange={(event) =>
                            setLineRepresentation(
                              message,
                              event.target.value as MessageRepresentation | "",
                            )
                          }
                          sx={{
                            color: "text.secondary",
                            fontSize: "0.625rem",
                            minWidth: 0,
                            "&::before, &::after": { borderBottom: 0 },
                            "& .MuiSelect-select": { py: 0 },
                          }}
                        >
                          <MenuItem value="">
                            {globalRepresentation
                              ? `Use global (${representationLabels[globalRepresentation]})`
                              : `Use original (${representationLabels[message.encoding]})`}
                          </MenuItem>
                          {(Object.keys(representationLabels) as MessageRepresentation[]).map(
                            (option) => (
                              <MenuItem
                                key={option}
                                value={option}
                                disabled={option === "json" && !canRepresentAsJson(message)}
                              >
                                {representationLabels[option]}
                              </MenuItem>
                            ),
                          )}
                        </Select>
                        <Box component="div" sx={{ whiteSpace: "pre-wrap" }}>
                          {representMessage(message, representation)}
                        </Box>
                      </TableCell>
                      <TableCell>{format(message.timestamp, "HH:mm:ss")}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </StyledTable>
        </TableContainer>
        <Menu
          anchorEl={globalRepresentationAnchor}
          open={Boolean(globalRepresentationAnchor)}
          onClose={() => setGlobalRepresentationAnchor(null)}
        >
          <MenuItem onClick={() => setGlobalMessageRepresentation(null)}>
            Original representation
          </MenuItem>
          {globalRepresentationOptions.map((representation) => (
            <MenuItem
              key={representation}
              onClick={() => setGlobalMessageRepresentation(representation)}
            >
              {representationLabels[representation]}
            </MenuItem>
          ))}
        </Menu>
      </AccordionDetails>
    </Accordion>
  );
}
