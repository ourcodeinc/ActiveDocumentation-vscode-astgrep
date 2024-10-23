/**
 * Geenerates the WebSocket-ready message
 * @param command
 * @param data
 * @returns {string}
 */
export const createWebSocketMessage = (command: string, data: object): string => {
    return JSON.stringify({
        command: command,
        data: data,
    });
};
