<?php

namespace App\Http\Controllers\PrototypeMessaging;

use App\Http\Controllers\Controller;
use App\Http\Resources\PrototypeMessaging\PrototypeMessageResource;
use App\Models\PrototypeMessage;
use App\Prototype\Messaging\PrototypeMessagingChannels;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

final class ListPrototypeMessagesController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'channel' => ['required', 'string', Rule::in(PrototypeMessagingChannels::all())],
            'after' => ['nullable', 'integer', 'min:0'],
        ]);

        $query = PrototypeMessage::query()
            ->with(['sender.employee.department'])
            ->where('channel', $validated['channel']);
        $after = array_key_exists('after', $validated) ? (int) $validated['after'] : null;

        $messages = $after !== null
            ? $query->where('id', '>', $after)->orderBy('id')->limit(100)->get()
            : $query->orderByDesc('id')->limit(50)->get()->sortBy('id')->values();

        return PrototypeMessageResource::collection($messages);
    }
}
