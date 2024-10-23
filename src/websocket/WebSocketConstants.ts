/* eslint-disable @typescript-eslint/naming-convention */
export const WEBSOCKET_SENT_MESSAGE = {
    WEBSOCKET_CONNECTED_MSG: "CONNECTED",
    WEBSOCKET_DISCONNECTED_MSG: "DISCONNECTED",

    RULE_TABLE_MSG: "RULE_TABLE",
};


export interface websocketMessageStructure {
  command: "string",
  data: "object",
}
