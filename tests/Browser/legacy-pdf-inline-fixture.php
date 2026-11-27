<?php

declare(strict_types=1);

use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (getenv('GITHUB_ACTIONS') !== 'true'
    || getenv('APP_ENV') !== 'testing'
    || getenv('DB_DATABASE') !== 'talibon_portal_test'
    || getenv('DB_HOST') !== '127.0.0.1'
    || DB::connection()->getDriverName() !== 'pgsql'
    || DB::connection()->getDatabaseName() !== 'talibon_portal_test'
    || DB::table('users')->exists()
    || DB::table('documents')->exists()) {
    throw new RuntimeException('Refusing non-isolated or nonempty fixture environment.');
}
$password = getenv('PDF_QA_PASSWORD');
if (! is_string($password) || strlen($password) < 20) {
    throw new RuntimeException('Synthetic credential missing.');
}

$pdf = <<<'PDF'
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Length 59 >>
stream
BT /F1 24 Tf 50 680 Td (Synthetic evidence page one) Tj ET
endstream
endobj
7 0 obj
<< /Length 59 >>
stream
BT /F1 24 Tf 50 680 Td (Synthetic evidence page two) Tj ET
endstream
endobj
xref
0 8
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000121 00000 n 
0000000247 00000 n 
0000000373 00000 n 
0000000443 00000 n 
0000000551 00000 n 
trailer
<< /Size 8 /Root 1 0 R >>
startxref
659
%%EOF
PDF;
$pdf .= "\n";
$document = DB::transaction(function () use ($password, $pdf): Document {
    $office = Department::query()->create([
        'code' => 'PDF-QA', 'name' => 'Synthetic PDF Office', 'short_name' => 'PDF QA',
        'branch' => 'executive', 'office_type' => 'department', 'sort_order' => 10,
        'is_active' => true, 'is_routable' => true,
    ]);
    $user = User::query()->create([
        'name' => 'Synthetic PDF Reviewer', 'username' => 'qa.pdf.viewer',
        'password' => $password, 'role' => 'department_head', 'is_active' => true,
        'account_status' => 'active',
    ]);
    Employee::query()->create([
        'employee_number' => 'QA-PDF-001', 'full_name' => $user->name, 'user_id' => $user->id,
        'department_id' => $office->id, 'position_title' => 'Synthetic Reviewer',
        'employment_status' => 'active',
    ]);
    $transaction = WorkflowTransaction::query()->create([
        'reference_no' => 'QA-PDF-TX', 'transaction_type' => 'internal_request',
        'title' => 'Synthetic PDF work request', 'priority' => 'normal',
        'origin_department_id' => $office->id, 'current_department_id' => $office->id,
        'created_by_user_id' => $user->id, 'status' => 'submitted',
    ]);
    $path = '2026/11/'.Str::uuid().'.pdf';
    if (! Storage::disk('documents')->put($path, $pdf)) {
        throw new RuntimeException('Synthetic file write failed.');
    }
    $document = Document::query()->create([
        'title' => 'Synthetic two-page evidence', 'original_name' => 'synthetic-two-page.pdf',
        'document_type' => 'supporting_document', 'classification' => 'internal',
        'mime_type' => 'application/pdf', 'size_bytes' => strlen($pdf),
        'checksum_sha256' => hash('sha256', $pdf), 'storage_disk' => 'documents',
        'storage_path' => $path, 'owner_department_id' => $office->id,
        'uploaded_by_user_id' => $user->id,
    ]);
    DocumentLink::query()->create([
        'document_id' => $document->id, 'linkable_type' => $transaction->getMorphClass(),
        'linkable_id' => $transaction->id, 'relationship' => 'supporting_document',
        'created_by_user_id' => $user->id,
    ]);

    return $document;
});

if (! is_dir(storage_path('app/qa'))) {
    mkdir(storage_path('app/qa'), 0700, true);
}
file_put_contents(storage_path('app/qa/legacy-pdf-fixture.json'), json_encode([
    'publicId' => $document->public_id,
    'sha256' => $document->checksum_sha256,
], JSON_THROW_ON_ERROR));
