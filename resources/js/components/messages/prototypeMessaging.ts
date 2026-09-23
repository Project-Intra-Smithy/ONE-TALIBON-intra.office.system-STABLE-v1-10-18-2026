export type PrototypeMessage = {
    publicId: string;
    cursor: number;
    channel: string;
    body: string;
    createdAt: string;
    sender: {
        name: string | null;
        office: string | null;
    };
    isMine: boolean;
};

export const prototypeMessagesEndpoint = '/messages/prototype/messages';

export function normalizePrototypeChannel(channel: string): string {
    return channel === 'Mayor’s Office' ? "Mayor's Office" : channel;
}

export function mergePrototypeMessages(
    current: PrototypeMessage[],
    incoming: PrototypeMessage[],
): PrototypeMessage[] {
    const byPublicId = new Map(current.map((message) => [message.publicId, message]));
    incoming.forEach((message) => byPublicId.set(message.publicId, message));

    return [...byPublicId.values()].sort((left, right) => left.cursor - right.cursor);
}

export function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}
