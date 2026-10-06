<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Http\Resources\Messaging\MessageResource;
use App\Messaging\MessagingChannels;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

final class ListMessagesController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'channel' => ['required', 'string', Rule::in(MessagingChannels::all())],
            'after' => ['nullable', 'integer', 'min:0'],
        ]);

        $query = Message::query()
            ->with(['sender.employee.department'])
            ->where('channel', $validated['channel']);
        $after = array_key_exists('after', $validated) ? (int) $validated['after'] : null;

        $messages = $after !== null
            ? $query->where('id', '>', $after)->orderBy('id')->limit(100)->get()
            : $query->orderByDesc('id')->limit(50)->get()->sortBy('id')->values();

        return MessageResource::collection($messages);
    }
}
