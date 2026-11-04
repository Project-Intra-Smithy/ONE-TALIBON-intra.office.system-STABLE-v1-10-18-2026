import { FileText } from 'lucide-react';

/** Dashboard overview only. Records owns authorized document visibility. */
export default function R7DocumentsPanel() {
    return (
        <section className="r7-lower-card r7-lower-documents r7-evidence-card" aria-labelledby="r7-documents-title">
            <h2 className="r7-lower-title" id="r7-documents-title">
                <FileText size={18} aria-hidden="true" /> Recent documents
            </h2>
            <div className="r7-lower-body r7-evidence-body">
                <p className="r7-evidence-empty">No document preview is available here.</p>
                <p className="r7-evidence-hint">Open Records to view documents you can access.</p>
            </div>
        </section>
    );
}
