import type { MqttMessage } from "../stores/mqtt";

export interface ReplayController {
  cancel: () => void;
}

export function replayMessages(
  messages: MqttMessage[],
  publish: (message: MqttMessage) => void,
  onComplete?: () => void,
  onProgress?: (completed: number, total: number) => void,
): ReplayController {
  const orderedMessages = [...messages].sort(
    (first, second) => first.timestamp.getTime() - second.timestamp.getTime(),
  );
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let index = 0;

  function next() {
    if (cancelled) return;

    const message = orderedMessages[index];
    if (!message) {
      onComplete?.();
      return;
    }

    publish(message);
    index += 1;
    onProgress?.(index, orderedMessages.length);

    const followingMessage = orderedMessages[index];
    if (!followingMessage) {
      onComplete?.();
      return;
    }

    const delay = Math.max(0, followingMessage.timestamp.getTime() - message.timestamp.getTime());
    timer = setTimeout(next, delay);
  }

  next();

  return {
    cancel: () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    },
  };
}
