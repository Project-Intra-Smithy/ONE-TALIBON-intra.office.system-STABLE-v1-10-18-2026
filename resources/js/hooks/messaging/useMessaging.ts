import { useCallback, useEffect, useRef, useState } from 'react';
import {
    mergeMessages,
    messagesEndpoint,
    type Message,
    xsrfToken,
} from '../../components/messages/messaging';

type Payload = { data: Message[] };
type SinglePayload = { data: Message };
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
    console.warn('[MP0 messaging] send failed', { status, contentType: contentType ?? 'unknown', category });
}

export default function useMessaging(channel: string | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [pollError, setPollError] = useState<string | null>(null);
    const sendController = useRef<AbortController | null>(null);

    useEffect(() => {
        setMessages([]);
        setSendError(null);
        setPollError(null);
        if (!channel) return;

        let active = true;
        let cursor = 0;
        let inFlight = false;
        let pollController: AbortController | null = null;

        const synchronize = async (initial: boolean) => {
            if (inFlight || (!initial && document.hidden)) return;
            const request = new AbortController();
            pollController = request;
            inFlight = true;
            const params = new URLSearchParams({ channel });
            if (!initial) params.set('after', String(cursor));

            try {
                const response = await fetch(`${messagesEndpoint}?${params}`, {
                    headers: { Accept: 'application/json' },
                    signal: request.signal,
                });
                if (!response.ok) throw new Error('Messages could not be loaded.');
                const payload = await response.json() as Payload;
                if (!active || pollController !== request) return;
                setMessages((current) => mergeMessages(current, payload.data));
                cursor = Math.max(cursor, ...payload.data.map((message) => message.cursor), 0);
                setPollError(null);
            } catch (error) {
                if (active && pollController === request && !(error instanceof DOMException && error.name === 'AbortError')) {
                    setPollError('New messages could not be synchronized.');
                }
            } finally {
                if (pollController === request) {
                    pollController = null;
                    inFlight = false;
                }
            }
        };

        void synchronize(true);
        const timer = window.setInterval(() => void synchronize(false), 3000);
        const onVisibility = () => { if (!document.hidden) void synchronize(false); };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            active = false;
            pollController?.abort();
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
            const response = await fetch(messagesEndpoint, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': xsrfToken(),
                },
                body: JSON.stringify({ channel, body: trimmed }),
                signal: controller.signal,
            });
            const contentType = response.headers.get('content-type');
            if (!response.ok) {
                reportSendFailure(response.status, contentType, classifySendFailure(response.status));
                throw new Error('Message could not be sent.');
            }
            if (!contentType?.includes('application/json')) reportSendFailure(response.status, contentType, 'http');
            const payload = await response.json() as SinglePayload;
            setMessages((current) => mergeMessages(current, [payload.data]));
            return true;
        } catch (error) {
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
                if (import.meta.env.DEV && error instanceof TypeError) reportSendFailure(0, null, 'network');
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
