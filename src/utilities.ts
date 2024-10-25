/**
 * Generates the WebSocket-ready message
 * @param command
 * @param data
 * @returns
 * @throws Error when the data is not a plain object
 */
export const createWebSocketMessage = (command: string, data: object) : string => {
    return JSON.stringify({
        command: command,
        data: data,
    });
};
