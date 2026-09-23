import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
    children: ReactNode;
};

export default function PublicReveal({ children }: Props) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setReady(true);

        if (reducedMotion) {
            setVisible(true);
            return;
        }

        const observer = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            setVisible(true);
            observer.disconnect();
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -8% 0px',
        });

        observer.observe(root);
        return () => observer.disconnect();
    }, []);

    return <div
        ref={rootRef}
        className="public-reveal"
        data-reveal-ready={ready ? 'true' : 'false'}
        data-reveal-visible={visible ? 'true' : 'false'}
    >
        {children}
    </div>;
}
