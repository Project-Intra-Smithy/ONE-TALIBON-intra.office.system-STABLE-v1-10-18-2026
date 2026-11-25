import DocumentPreviewPresentation from '../../../../../resources/js/components/planning/DocumentPreviewPresentation';
import { Download, FileSpreadsheet, FileText, Image as ImageIcon, Lock, Printer, ShieldCheck, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import {
    ATTACHMENT_CATEGORY_META,
    ATTACHMENT_VISIBILITY_META,
    type PlanningAttachment,
} from '../../data/municipal/planningGovernance';
import { formatDatePH } from '../../lib/format';
import { Button, Dialog, StatusBadge } from '../ui';

type Props = {
    attachment: PlanningAttachment | null;
    onClose: () => void;
};

const ZOOM_STEPS = [100, 130, 165, 210] as const;

export function triggerAttachmentDownload(doc: PlanningAttachment) {
    if (typeof window === 'undefined') return;
    if (doc.previewImageUrl) {
        const link = document.createElement('a');
        link.href = doc.previewImageUrl;
        link.download = doc.filename;
        link.click();
        return;
    }

    const lines = [
        'REPUBLIC OF THE PHILIPPINES',
        'PROVINCE OF BOHOL · MUNICIPALITY OF TALIBON',
        'ONE TALIBON · LOCAL DEVELOPMENT PLANNING SUITE',
        '============================================================',
        `Document Title   : ${doc.title}`,
        `Control Ref      : ${doc.controlRef}`,
        `Category         : ${ATTACHMENT_CATEGORY_META[doc.category].label}`,
        `Format / Size    : ${doc.formatLabel} (${doc.sizeLabel})`,
        `Visibility Tier  : ${ATTACHMENT_VISIBILITY_META[doc.visibility].label}`,
        `Uploaded         : ${doc.uploadedAt} by ${doc.uploadedBy}`,
        '',
        'SUMMARY / EXCERPT:',
        doc.previewExcerpt || 'Official municipal planning supporting document on file.',
        '',
        ...(doc.previewFields?.map(([k, v]) => `${k}: ${v}`) ?? []),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.filename.endsWith('.txt') ? doc.filename : `${doc.controlRef || doc.id}_reference.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DocumentPreviewModal({attachment,onClose}:Props){
    if(!attachment)return null;
    return <DocumentPreviewPresentation attachment={attachment} onClose={onClose} categoryMeta={ATTACHMENT_CATEGORY_META[attachment.category]} visibilityMeta={ATTACHMENT_VISIBILITY_META[attachment.visibility]} onDownload={()=>triggerAttachmentDownload(attachment)} />;
}
