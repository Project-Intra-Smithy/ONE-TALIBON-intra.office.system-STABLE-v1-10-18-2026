import React, { createContext, useContext, useEffect, useState } from 'react';

type VisitOptions = { onFinish?: () => void; onSuccess?: () => void; onError?: (errors: Record<string, string>) => void; replace?: boolean; only?: string[]; [key: string]: unknown };
type Page = { url: string; props: Record<string, any>; flash?: Record<string, any> };
type QueryScalar = string | number | boolean | null | undefined;
type QueryValue = QueryScalar | QueryScalar[];
type QueryData = Record<string, QueryValue>;

const standaloneOrigin = 'http://standalone.invalid';

function relativeUrl(href: string): URL | null {
    if (!href.startsWith('/') || href.startsWith('//')) return null;
    try {
        const url = new URL(href, standaloneOrigin);
        return url.origin === standaloneOrigin ? url : null;
    } catch {
        return null;
    }
}

function serializedScalar(value: QueryScalar): string | null {
    if (typeof value === 'string') return value === '' ? null : value;
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return null;
}

/** GET-only standalone query adapter. It accepts relative paths and never performs network I/O. */
export function serializeGetHref(href: string, data: QueryData = {}): string | null {
    const url = relativeUrl(href);
    if (!url) return null;

    for (const [key, rawValue] of Object.entries(data)) {
        url.searchParams.delete(key);
        const values = Array.isArray(rawValue) ? rawValue : [rawValue];
        for (const value of values) {
            const serialized = serializedScalar(value);
            if (serialized !== null) url.searchParams.append(key, serialized);
        }
    }

    return `${url.pathname}${url.search}${url.hash}`;
}

const PageContext = createContext<Page>({ url: '/', props: {} });
export function StandalonePageProvider({ page, children }: { page: Page; children: React.ReactNode }) {
    return <PageContext.Provider value={page}>{children}</PageContext.Provider>;
}
export function usePage<T = Record<string, any>>() { return useContext(PageContext) as Page & { props: T }; }

function navigate(href: string, replace = false) {
    const safeHref = serializeGetHref(href);
    if (!safeHref) return false;
    if (replace) window.history.replaceState({}, '', safeHref);
    else window.history.pushState({}, '', safeHref);
    window.dispatchEvent(new PopStateEvent('popstate'));
    return true;
}

type InertiaLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href?: string;
    preserveScroll?: boolean;
    preserveState?: boolean;
    replace?: boolean;
    method?: string;
    as?: string;
    data?: unknown;
    only?: string[];
    except?: string[];
    headers?: Record<string, string>;
    forceFormData?: boolean;
    onBefore?: () => unknown;
    onStart?: () => void;
    onProgress?: () => void;
    onFinish?: () => void;
    onCancel?: () => void;
    onSuccess?: () => void;
    onError?: () => void;
};

export function Link({
    href = '#',
    children,
    onClick,
    preserveScroll: _preserveScroll,
    preserveState: _preserveState,
    replace = false,
    method: _method,
    as: _as,
    data: _data,
    only: _only,
    except: _except,
    headers: _headers,
    forceFormData: _forceFormData,
    onBefore: _onBefore,
    onStart: _onStart,
    onProgress: _onProgress,
    onFinish: _onFinish,
    onCancel: _onCancel,
    onSuccess: _onSuccess,
    onError: _onError,
    ...props
}: InertiaLinkProps) {
    return (
        <a
            href={href}
            {...props}
            onClick={(event) => {
                onClick?.(event);
                if (
                    event.defaultPrevented
                    || event.metaKey
                    || event.ctrlKey
                    || event.shiftKey
                    || event.altKey
                    || event.button !== 0
                ) {
                    return;
                }
                if (href.startsWith('/')) {
                    event.preventDefault();
                    navigate(href, replace);
                }
            }}
        >
            {children}
        </a>
    );
}

export function Head({ title }: { title?: string; children?: React.ReactNode }) {
    useEffect(() => {
        if (title) document.title = `${title} | ONE TALIBON`;
    }, [title]);
    return null;
}

const visit = (href: string, _data?: unknown, options?: VisitOptions) => {
    if (navigate(href, options?.replace === true)) options?.onSuccess?.();
    options?.onFinish?.();
};
const blockedWrite = (_href: string, _data?: unknown, options?: VisitOptions) => {
    const message = 'Preview action unavailable. No municipal record was submitted or saved.';
    window.dispatchEvent(new CustomEvent('ot:preview-write-blocked', { detail: message }));
    options?.onError?.({ preview: message });
    options?.onFinish?.();
};
const get = (href: string, data?: QueryData, options?: VisitOptions) => {
    const target = serializeGetHref(href, data);
    const navigated = target ? navigate(target, options?.replace === true) : false;
    if (navigated) options?.onSuccess?.();
    options?.onFinish?.();
};
const reload = (options?: VisitOptions) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
    options?.onSuccess?.();
    options?.onFinish?.();
};
export const router = {
    get, post: blockedWrite, put: blockedWrite, patch: blockedWrite, delete: blockedWrite,
    visit: (href: string, options?: VisitOptions) =>
        options?.method && String(options.method).toLowerCase() !== 'get'
            ? blockedWrite(href, options.data, options)
            : visit(href, undefined, options),
    reload,
};

export function useForm<T extends Record<string, any>>(initial: T) {
    const [data, setState] = useState<T>(initial);
    const setData = (key: keyof T | Partial<T>, value?: unknown) =>
        setState((current) => (typeof key === 'object' ? { ...current, ...key } : { ...current, [key]: value }));
    const reset = (...keys: (keyof T)[]) =>
        setState((current) => (keys.length ? keys.reduce((next, key) => ({ ...next, [key]: initial[key] }), current) : initial));
    const submit = (method: string, href: string, options?: VisitOptions) =>
        method.toLowerCase() === 'get' ? get(href, data as QueryData, options) : blockedWrite(href, data, options);
    return {
        data,
        setData,
        reset,
        // Unsupported preview writes never serialize or submit transformed payloads.
        transform: (_callback: (value: T) => unknown) => {},
        clearErrors: () => {},
        setError: () => {},
        errors: {} as Record<string, string>,
        processing: false,
        recentlySuccessful: false,
        wasSuccessful: false,
        isDirty: JSON.stringify(data) !== JSON.stringify(initial),
        get: (href: string, options?: VisitOptions) => get(href, data as QueryData, options),
        post: (href: string, options?: VisitOptions) => blockedWrite(href, data, options),
        put: (href: string, options?: VisitOptions) => blockedWrite(href, data, options),
        patch: (href: string, options?: VisitOptions) => blockedWrite(href, data, options),
        delete: (href: string, options?: VisitOptions) => blockedWrite(href, data, options),
        submit,
    };
}

export function createInertiaApp() { throw new Error('Laravel Inertia bootstrap is not used by the isolated runtime.'); }
export type ResolvedComponent = React.ComponentType<any>;
export function useRemember<T>(value: T) { return useState(value); }
export function usePoll() { return undefined; }
export function Deferred({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function WhenVisible({ children }: { children: React.ReactNode }) { return <>{children}</>; }
