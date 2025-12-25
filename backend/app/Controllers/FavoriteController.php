<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Favorite;
use App\Models\Channel;
use App\Helpers\ResponseFormatter;
use Ramsey\Uuid\Uuid;

class FavoriteController
{
    public function index(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        
        $customer = \App\Models\Customer::where('uuid', $user->sub)->first();
        if (!$customer) {
            return ResponseFormatter::error($response, 'User not found', 404);
        }

        // Get favorites with channel details
        $favorites = Favorite::where('customer_id', $customer->id)
            ->with('channel')
            ->get();
            
        $channels = $favorites->map(function ($fav) {
            return $fav->channel;
        })->filter(); // remove nulls if any

        return ResponseFormatter::success($response, $channels->values());
    }

    public function toggle(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $data = $request->getParsedBody();
        $channelUuid = $data['channel_uuid'] ?? null;

        if (!$channelUuid) {
            return ResponseFormatter::error($response, 'Channel UUID is required', 400);
        }

        $channel = Channel::where('uuid', $channelUuid)->first();
        if (!$channel) {
            return ResponseFormatter::error($response, 'Channel not found', 404);
        }

        $customer = \App\Models\Customer::where('uuid', $user->sub)->first();
        if (!$customer) {
            return ResponseFormatter::error($response, 'User not found', 404);
        }

        $favorite = Favorite::where('channel_id', $channel->id)
            ->where('customer_id', $customer->id)
            ->first();

        if ($favorite) {
            $favorite->delete();
            return ResponseFormatter::success($response, ['is_favorite' => false], 'Removed from favorites');
        } else {
            $favorite = new Favorite();
            $favorite->uuid = Uuid::uuid4()->toString();
            $favorite->channel_id = $channel->id;
            $favorite->customer_id = $customer->id;
            $favorite->save();
            return ResponseFormatter::success($response, ['is_favorite' => true], 'Added to favorites');
        }
    }
    
    // Helper to get formatted list of favorite UUIDs for sync
    public function getIds(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $customer = \App\Models\Customer::where('uuid', $user->sub)->first();
        
        if (!$customer) {
             return ResponseFormatter::success($response, []);
        }

        $favoriteChannelIds = Favorite::where('customer_id', $customer->id)
            ->join('channels', 'favorites.channel_id', '=', 'channels.id')
            ->pluck('channels.uuid');

        return ResponseFormatter::success($response, $favoriteChannelIds);
    }
}
