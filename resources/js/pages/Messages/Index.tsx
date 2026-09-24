import { useEffect, useMemo, useRef, useState } from 'react';
import ConversationList from '../../components/messages/ConversationList';
import MessageContextPanel, { MessageContextDialog } from '../../components/messages/MessageContextPanel';
import MessageThread from '../../components/messages/MessageThread';
import {
    buildMessageConversations,
    filterMessageConversations,
    findConversationByChannel,
} from '../../components/messages/messageWorkspace';
import AppLayout from '../../layouts/AppLayout';

type MobileView = 'conversations' | 'thread';

type InitialMessagesState = {
    query: string;
    channel: string | null;
    view: MobileView | null;
};

function readInitialMessagesState(): InitialMessagesState {
    if (typeof window === 'undefined') return { query: '', channel: null, view: null };
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    return {
        query: params.get('q') ?? '',
        channel: params.get('channel'),
        view: view === 'conversations' || view === 'thread' ? view : null,
    };
}

export default function Index() {
    const initialState = useMemo(readInitialMessagesState, []);
    const conversations = useMemo(buildMessageConversations, []);
    const initialConversation = useMemo(
        () => findConversationByChannel(conversations, initialState.channel) ?? conversations[0] ?? null,
        [conversations, initialState.channel],
    );
    const initialSelectionExplicit = Boolean(findConversationByChannel(conversations, initialState.channel));
    const initialMobileView: MobileView = initialState.view ?? (initialSelectionExplicit ? 'thread' : 'conversations');

    const [query, setQuery] = useState(initialState.query);
    const [selectedChannel, setSelectedChannel] = useState<string | null>(initialConversation?.channel ?? null);
    const [selectionExplicit, setSelectionExplicit] = useState(initialSelectionExplicit);
    const [mobileView, setMobileView] = useState<MobileView>(initialMobileView);
    const [contextOpen, setContextOpen] = useState(false);
    const conversationButtons = useRef(new Map<string, HTMLButtonElement>());
    const lastConversationTrigger = useRef<HTMLButtonElement | null>(null);
    const threadHeading = useRef<HTMLHeadingElement | null>(null);
    const searchInput = useRef<HTMLInputElement | null>(null);

    const visibleConversations = useMemo(
        () => filterMessageConversations(conversations, query),
        [conversations, query],
    );
    const selectedConversation = useMemo(
        () => findConversationByChannel(conversations, selectedChannel),
        [conversations, selectedChannel],
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams();
        const normalizedQuery = query.trim();
        if (normalizedQuery) params.set('q', normalizedQuery);
        if (selectionExplicit && selectedChannel) params.set('channel', selectedChannel);
        if (selectionExplicit) params.set('view', mobileView);

        const search = params.toString();
        const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
        const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (nextUrl !== currentUrl) window.history.replaceState(window.history.state, '', nextUrl);
    }, [mobileView, query, selectedChannel, selectionExplicit]);

    const selectConversation = (channel: string, trigger: HTMLButtonElement) => {
        lastConversationTrigger.current = trigger;
        setSelectedChannel(channel);
        setSelectionExplicit(true);
        setContextOpen(false);
        setMobileView('thread');
        if (window.matchMedia('(max-width: 767px)').matches) {
            window.requestAnimationFrame(() => threadHeading.current?.focus());
        }
    };

    const returnToConversations = () => {
        setContextOpen(false);
        setMobileView('conversations');
        window.requestAnimationFrame(() => {
            const selectedButton = selectedChannel ? conversationButtons.current.get(selectedChannel) : null;
            (lastConversationTrigger.current ?? selectedButton ?? searchInput.current)?.focus();
        });
    };

    return (
        <AppLayout title="Messages">
            <div className="-mx-3 h-[calc(100dvh-7.75rem)] min-h-0 overflow-hidden border-y border-[var(--municipal-border)] bg-[var(--municipal-surface)] sm:mx-auto sm:max-w-[1600px] sm:rounded-xl sm:border sm:shadow-sm">
                <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)] md:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_300px]">
                    <div className={`${mobileView === 'thread' ? 'hidden md:block' : 'block'} h-full min-h-0 md:border-r md:border-[var(--municipal-border)]`}>
                        <ConversationList
                            conversations={visibleConversations}
                            selectedChannel={selectedChannel}
                            query={query}
                            onQueryChange={setQuery}
                            onSelect={selectConversation}
                            registerButton={(channel, node) => {
                                if (node) conversationButtons.current.set(channel, node);
                                else conversationButtons.current.delete(channel);
                            }}
                            registerSearch={(node) => { searchInput.current = node; }}
                        />
                    </div>
                    <div className={`${mobileView === 'conversations' ? 'hidden md:block' : 'block'} h-full min-h-0`}>
                        <MessageThread
                            conversation={selectedConversation}
                            onBack={returnToConversations}
                            onOpenContext={() => setContextOpen(true)}
                            registerHeading={(node) => { threadHeading.current = node; }}
                        />
                    </div>
                    <MessageContextPanel conversation={selectedConversation} />
                </div>
            </div>
            <MessageContextDialog open={contextOpen} onClose={() => setContextOpen(false)} conversation={selectedConversation} />
        </AppLayout>
    );
}
