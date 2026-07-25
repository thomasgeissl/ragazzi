import type { AnyAction } from "redux";
import type { PayloadEncoding } from "../../lib/payload";

export const types = {
  SETCONNECTED: "SETCONNECTED",
  ADDRECEIVEDMESSAGE: "ADDRECEIVEDMESSAGE",
  ADDSENTMESSAGE: "ADDSENTMESSAGE",
  ADDSUBSCRIPTION: "ADDSUBSCRIPTION",
  SUBSCRIBE: "SUBSCRIBE",
  UNSUBSCRIBE: "UNSUBSCRIBE",
  UNSUBSCRIBEALL: "UNSUBSCRIBEALL",
  SETBROKER: "SETBROKER",
  CLEARMESSAGES: "CLEARMESSAGES",
} as const;

export type MessageType = "INCOMING" | "OUTGOING";

export interface MqttMessage {
  topic: string;
  message: string;
  encoding: PayloadEncoding;
  timestamp: Date;
  type: MessageType;
}

export interface MqttState {
  connected: boolean;
  receivedMessages: MqttMessage[];
  sentMessages: MqttMessage[];
  protocol: string;
  host: string;
  port: number;
  subscriptions: Map<string, boolean>;
}

const defaultState: MqttState = {
  connected: false,
  receivedMessages: [],
  sentMessages: [],
  protocol: "ws",
  host: "localhost",
  port: 9001,
  subscriptions: new Map(),
};

export const setBroker = (protocol: string, host: string, port: number) => ({
  type: types.SETBROKER,
  payload: {
    protocol,
    host,
    port,
  },
});

export const setConnected = (value: boolean) => ({
  type: types.SETCONNECTED,
  payload: {
    value,
  },
});

export const addReceivedMessage = (
  topic: string,
  message: string,
  encoding: PayloadEncoding = "utf8",
) => ({
  type: types.ADDRECEIVEDMESSAGE,
  payload: {
    topic,
    message,
    encoding,
  },
});

export const addSentMessage = (
  topic: string,
  message: string,
  encoding: PayloadEncoding = "utf8",
) => ({
  type: types.ADDSENTMESSAGE,
  payload: {
    topic,
    message,
    encoding,
  },
});

export const addSubscription = (value: string) => ({
  type: types.ADDSUBSCRIPTION,
  payload: {
    value,
  },
});

export const subscribe = (value: string) => ({
  type: types.SUBSCRIBE,
  payload: {
    value,
  },
});

export const unsubscribe = (value: string) => ({
  type: types.UNSUBSCRIBE,
  payload: {
    value,
  },
});

export const unsubscribeAll = () => ({
  type: types.UNSUBSCRIBEALL,
});

export const clearMessages = () => ({
  type: types.CLEARMESSAGES,
});

export type MqttAction =
  | ReturnType<typeof setBroker>
  | ReturnType<typeof setConnected>
  | ReturnType<typeof addReceivedMessage>
  | ReturnType<typeof addSentMessage>
  | ReturnType<typeof addSubscription>
  | ReturnType<typeof subscribe>
  | ReturnType<typeof unsubscribe>
  | ReturnType<typeof unsubscribeAll>
  | ReturnType<typeof clearMessages>;

export default (state: MqttState = defaultState, action: MqttAction | AnyAction): MqttState => {
  switch (action.type) {
    case types.SETBROKER: {
      const { protocol, host, port } = (action as ReturnType<typeof setBroker>).payload;
      return {
        ...state,
        protocol: protocol.trim(),
        host: host.trim(),
        port,
      };
    }
    case types.SETCONNECTED: {
      return {
        ...state,
        connected: (action as ReturnType<typeof setConnected>).payload.value,
      };
    }
    case types.ADDRECEIVEDMESSAGE: {
      let receivedMessages = [...state.receivedMessages];
      receivedMessages.unshift({
        ...(action as ReturnType<typeof addReceivedMessage>).payload,
        timestamp: new Date(),
        type: "INCOMING",
      });
      receivedMessages = receivedMessages.slice(0, 99);
      return {
        ...state,
        receivedMessages,
      };
    }
    case types.ADDSENTMESSAGE: {
      let sentMessages = [...state.sentMessages];
      sentMessages.unshift({
        ...(action as ReturnType<typeof addSentMessage>).payload,
        timestamp: new Date(),
        type: "OUTGOING",
      });
      sentMessages = sentMessages.slice(0, 99);
      return {
        ...state,
        sentMessages,
      };
    }
    case types.ADDSUBSCRIPTION: {
      const subscriptions = new Map(state.subscriptions);
      subscriptions.set((action as ReturnType<typeof addSubscription>).payload.value, true);
      return {
        ...state,
        subscriptions,
      };
    }
    case types.SUBSCRIBE: {
      const subscriptions = new Map(state.subscriptions);
      subscriptions.set((action as ReturnType<typeof subscribe>).payload.value, true);
      return {
        ...state,
        subscriptions,
      };
    }
    case types.UNSUBSCRIBE: {
      const subscriptions = new Map(state.subscriptions);
      subscriptions.set((action as ReturnType<typeof unsubscribe>).payload.value, false);
      return {
        ...state,
        subscriptions,
      };
    }
    case types.UNSUBSCRIBEALL: {
      const subscriptions = new Map(state.subscriptions);
      [...subscriptions.keys()].forEach((key) => {
        subscriptions.set(key, false);
      });
      return {
        ...state,
        subscriptions,
      };
    }
    case types.CLEARMESSAGES: {
      return {
        ...state,
        sentMessages: [],
        receivedMessages: [],
      };
    }
    default:
      return state;
  }
};

export const isSubscriptionListShown = (state: { mqtt: MqttState }): boolean => {
  return state.mqtt.subscriptions.size > 0;
};
