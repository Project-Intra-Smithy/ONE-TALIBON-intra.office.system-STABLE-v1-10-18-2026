import { prototypeChannels } from './prototypeChannels';

export type MessageConversation = {
    channel: string;
    description: string;
    offices: string[];
};

export function buildMessageConversations(): MessageConversation[] {
    return prototypeChannels.map(({ channel, description, offices }) => ({ channel, description, offices: [...offices] }));
}

export function filterMessageConversations(conversations: MessageConversation[], query: string): MessageConversation[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return conversations;

    return conversations.filter((conversation) => [
        conversation.channel,
        conversation.description,
        ...conversation.offices,
    ].some((value) => value.toLowerCase().includes(normalized)));
}

export function findConversationByChannel(conversations: MessageConversation[], channel: string | null): MessageConversation | null {
    if (!channel) return null;
    return conversations.find((conversation) => conversation.channel === channel) ?? null;
}
