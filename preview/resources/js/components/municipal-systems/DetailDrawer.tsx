import type { ReactNode } from 'react';
import { Dialog } from '../ui';

type Props = {
    open: boolean;
    onClose: () => void;
    title: string;
    eyebrow?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'compact' | 'standard';
};

export default function DetailDrawer({ open, onClose, title, eyebrow, children, footer }: Props) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            variant="drawer-right"
            title={title}
            description={eyebrow}
            footer={footer}
        >
            {children}
        </Dialog>
    );
}
