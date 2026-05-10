<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StreamServer extends Model
{
    protected $table = 'stream_servers';

    protected $fillable = [
        'uuid', 'server_name', 'server_code', 'description',
        'host_ipv4', 'host_ipv6', 'host_domain',
        'mist_api_protocol', 'mist_api_host', 'mist_api_port',
        'mist_server_username', 'mist_server_password', 'mist_challenge', 'mist_final_hash',
        'rtmp_publish_base_url', 'hls_base_url', 'https_hls_base_url',
        'cmaf_base_url', 'webrtc_base_url', 'srt_base_url',
        'server_type', 'provider_name', 'datacenter_region', 'country_code',
        'operating_system', 'kernel_version',
        'cpu_model', 'cpu_cores', 'cpu_threads',
        'memory_total_mb', 'disk_total_gb', 'bandwidth_limit_tb', 'network_speed_mbps',
        'gpu_enabled',
        'max_streams', 'max_viewers', 'current_streams', 'current_viewers',
        'health_status', 'purchased_at', 'expiry_at',
        'last_seen_at', 'last_stats_sync_at',
        'supports_hls', 'supports_rtmp', 'supports_cmaf', 'supports_webrtc', 'supports_srt', 'supports_transcoding',
        'api_whitelist_enabled', 'ssl_enabled',
        'status', 'notes', 'deleted_at',
    ];

    protected $casts = [
        'gpu_enabled'            => 'boolean',
        'supports_hls'           => 'boolean',
        'supports_rtmp'          => 'boolean',
        'supports_cmaf'          => 'boolean',
        'supports_webrtc'        => 'boolean',
        'supports_srt'           => 'boolean',
        'supports_transcoding'   => 'boolean',
        'api_whitelist_enabled'  => 'boolean',
        'ssl_enabled'            => 'boolean',
        'mist_api_port'          => 'integer',
        'cpu_cores'              => 'integer',
        'cpu_threads'            => 'integer',
        'memory_total_mb'        => 'integer',
        'disk_total_gb'          => 'integer',
        'network_speed_mbps'     => 'integer',
        'max_streams'            => 'integer',
        'max_viewers'            => 'integer',
        'current_streams'        => 'integer',
        'current_viewers'        => 'integer',
        'bandwidth_limit_tb'     => 'float',
    ];

    protected $hidden = ['mist_server_password'];

    public $timestamps = true;
}
