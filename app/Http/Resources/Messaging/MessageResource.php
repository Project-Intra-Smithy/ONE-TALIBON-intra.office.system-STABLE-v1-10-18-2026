<?php

namespace App\Http\Resources\Messaging;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $employee = $this->sender?->employee;
        $department = $employee?->department;
        $senderName = filled($employee?->full_name) ? $employee->full_name : $this->sender?->name;
        $office = $department?->short_name ?: $department?->name;

        return [
            'publicId' => $this->public_id,
            'cursor' => $this->id,
            'channel' => $this->channel,
            'body' => $this->body,
            'createdAt' => $this->created_at?->toIso8601String(),
            'sender' => [
                'name' => $senderName,
                'office' => $office,
            ],
            'isMine' => (int) $request->user()?->id === (int) $this->sender_user_id,
        ];
    }
}
