<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Http\Requests\Messaging\StoreMessageRequest;
use App\Http\Resources\Messaging\MessageResource;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

final class StoreMessageController extends Controller
{
    public function __invoke(StoreMessageRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $message = Message::query()->create([
            'public_id' => Str::uuid()->toString(),
            'channel' => $validated['channel'],
            'sender_user_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);
        $message->load(['sender.employee.department']);

        return (new MessageResource($message))
            ->response()
            ->setStatusCode(201);
    }
}
