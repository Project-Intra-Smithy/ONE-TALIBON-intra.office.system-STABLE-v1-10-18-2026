import type { MunicipalMessage } from '../../data/municipal/messages';

export type MessageConversation = {
    channel: string;
    messages: MunicipalMessage[];
    latestMessage: MunicipalMessage;
    messageCount: number;
    offices: string[];
    references: string[];
    hasHighPriority: boolean;
};

export function sortMessagesChronologically(messages: MunicipalMessage[]): MunicipalMessage[] {
    return [...messages].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildMessageConversations(messages: MunicipalMessage[]): MessageConversation[] {
    const grouped = new Map<string, MunicipalMessage[]>();

    messages.forEach((message) => {
        const thread = grouped.get(message.channel) ?? [];
        thread.push(message);
        grouped.set(message.channel, thread);
    });

    return [...grouped.entries()]
        .map(([channel, thread]) => {
            const ordered = sortMessagesChronologically(thread);
            return {
                channel,
                messages: ordered,
                latestMessage: ordered[ordered.length - 1],
                messageCount: ordered.length,
                offices: [...new Set(ordered.map((message) => message.office))],
                references: [...new Set(ordered.map((message) => message.reference))],
                hasHighPriority: ordered.some((message) => message.priority === 'High'),
            };
        })
        .sort((a, b) => b.latestMessage.date.localeCompare(a.latestMessage.date));
}

export function filterMessageConversations(conversations: MessageConversation[], query: string): MessageConversation[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return conversations;

    return conversations.filter((conversation) => conversation.messages.some((message) => [
        message.channel,
        message.office,
        message.subject,
        message.body,
        message.reference,
    ].some((value) => value.toLowerCase().includes(normalized))));
}

export function findMessageById(messages: MunicipalMessage[], messageId: string | null): MunicipalMessage | null {
    if (!messageId) return null;
    return messages.find((message) => message.id === messageId) ?? null;
}

export function findConversationByChannel(conversations: MessageConversation[], channel: string | null): MessageConversation | null {
    if (!channel) return null;
    return conversations.find((conversation) => conversation.channel === channel) ?? null;
}
