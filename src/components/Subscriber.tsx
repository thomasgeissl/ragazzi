import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { getClient } from "../mqtt";

import { useMqttStore } from "../stores/mqtt";

export default function Subscriber() {
  const [topic, setTopic] = useState("");
  const addSubscription = useMqttStore((state) => state.addSubscription);
  return (
    <Card>
      <CardContent>
        <Typography color="text.primary" gutterBottom>
          <b>Subscribe</b>
        </Typography>
        <TextField
          fullWidth
          label="topic"
          size="small"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              getClient().subscribe(topic);
              addSubscription(topic);
              setTopic("");
            }
          }}
        />
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          color="primary"
          type="button"
          onClick={() => {
            getClient().subscribe(topic);
            addSubscription(topic);
            setTopic("");
          }}
        >
          subscribe
        </Button>
      </CardActions>
    </Card>
  );
}
