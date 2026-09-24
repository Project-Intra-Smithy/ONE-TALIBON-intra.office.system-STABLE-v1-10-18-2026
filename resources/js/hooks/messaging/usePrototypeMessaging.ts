import { useCallback, useEffect, useRef, useState } from 'react';
import {
    csrfToken,
    mergePrototypeMessages,
    normalizePrototypeChannel,
    prototypeMessagesEndpoint,
    type PrototypeMessage,
} from '../../components/messages/prototypeMessaging';

type Payload = { data: PrototypeMessage[] };
type SinglePayload = { data: PrototypeMessage };
type SendFailureCategory = 'session-csrf' | 'validation' | 'throttle' | 'server' | 'route' | 'http' | 'network';

function classifySendFailure(status: number): SendFailureCategory {
    if (status === 419) return 'session-csrf';
    if (status === 422) return 'validation';
    if (status === 429) return 'throttle';
    if (status === 404) return 'route';
    if (status >= 500) return 'server';
    return 'http';
}

function reportSendFailure(status: number, contentType: string | null, category: SendFailureCategory): void {
    if (!import.meta.env.DEV) return;
    console.warn('[MP0 messaging] send failed', {
        status,
        contentType: contentType ?? 'unknown',
        category,
    });
}

export default function usePrototypeMessaging(channel: string | null) {
    const [messages, setMessages] = useState<PrototypeMessage[]>([]);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [pollError, setPollError] = useState<string | null>(null);
    const cursor = useRef(0);
    const polling = useRef(false);
    const sendController = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!channel) {
            setMessages([]);
            return;
        }

        let active = true;
        const controller = new AbortController();
        cursor.current = 0;
        setMessages([]);
        setPollError(null);

        const synchronize = async (initial: boolean) => {
            if (polling.current || (!initial && document.hidden)) return;
            polling.current = true;
            const params = new URLSearchParams({ channel: normalizePrototypeChannel(channel) });
            if (!initial) params.set('after', String(cursor.current));

            try {
                const response = await fetch(`${prototypeMessagesEndpoint}?${params}`, {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error('Prototype messages could not be loaded.');
                const payload = await response.json() as Payload;
                if (!active) return;
                setMessages((current) => mergePrototypeMessages(current, payload.data));
                cursor.current = Math.max(cursor.current, ...payload.data.map((message) => message.cursor), 0);
                setPollError(null);
            } catch (error) {
                if (active && !(error instanceof DOMException && error.name === 'AbortError')) {
                    setPollError('New messages could not be synchronized.');
                }
            } finally {
                polling.current = false;
            }
        };

        void synchronize(true);
        const timer = window.setInterval(() => void synchronize(false), 3000);
        const onVisibility = () => { if (!document.hidden) void synchronize(false); };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            active = false;
            polling.current = false;
            controller.abort();
            sendController.current?.abort();
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [channel]);

    const send = useCallback(async (body: string): Promise<boolean> => {
        const trimmed = body.trim();
        if (!channel || !trimmed || sending) return false;

        const controller = new AbortController();
        sendController.current = controller;
        setSending(true);
        setSendError(null);

        try {
            const response = await fetch(prototypeMessagesEndpoint, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ channel: normalizePrototypeChannel(channel), body: trimmed }),
                signal: controller.signal,
            });

            const contentType = response.headers.get('content-type');
            if (!response.ok) {
                reportSendFailure(response.status, contentType, classifySendFailure(response.status));
                throw new Error('Prototype message could not be sent.');
            }

            if (!contentType?.includes('application/json')) {
                reportSendFailure(response.status, contentType, 'http');
            }
            const payload = await response.json() as SinglePayload;
            setMessages((current) => mergePrototypeMessages(current, [payload.data]));
            return true;
        } catch (error) {
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
                if (import.meta.env.DEV && error instanceof TypeError) {
                    reportSendFailure(0, null, 'network');
                }
                setSendError('Message was not sent. Keep the text and try again.');
            }
            return false;
        } finally {
            if (sendController.current === controller) {
                sendController.current = null;
                setSending(false);
            }
        }
    }, [channel, sending]);

    return { messages, sending, sendError, pollError, send };
}
