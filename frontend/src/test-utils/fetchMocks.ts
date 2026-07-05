export const buildResponse = (ok: boolean, status: number, data: unknown): Response =>
    ({ ok, status, json: () => Promise.resolve(data) } as Response);
