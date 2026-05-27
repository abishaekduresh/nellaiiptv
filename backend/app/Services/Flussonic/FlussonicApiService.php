<?php

namespace App\Services\Flussonic;

use App\Helpers\EncryptionHelper;
use App\Models\StreamServer;
use Exception;

/**
 * Flussonic Media Server API service.
 *
 * Auth: HTTP Basic Auth (username:password) or Bearer token.
 * Base URL pattern: http(s)://{host}:{port}/streamer/api/{version}
 * Ref: https://flussonic.com/doc/api/
 */
class FlussonicApiService
{
    private const CONNECT_TIMEOUT = 8;
    private const REQUEST_TIMEOUT = 15;
    private const SOCKET_TIMEOUT  = 5;

    // ─────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────

    /**
     * Validate plaintext credentials against a live Flussonic server.
     * Auto-detects HTTP vs HTTPS. Returns the working scheme.
     *
     * @throws Exception on unreachable host, auth failure, or bad response
     */
    public function validateCredentials(
        string $host,
        int    $port,
        string $version,
        string $username,
        string $plainPassword
    ): string {
        $this->assertPortOpen($host, $port);

        $scheme = $this->detectScheme($host, $port, $username, $plainPassword, null);
        $url    = $this->buildUrl($host, $port, $version, 'monitoring/liveness', $scheme);
        $this->get($url, $username, $plainPassword, null);

        return $scheme;
    }

    /**
     * Validate a bearer token against a live Flussonic server.
     * Auto-detects HTTP vs HTTPS. Returns the working scheme.
     *
     * @throws Exception on unreachable host, auth failure, or bad response
     */
    public function validateBearerToken(
        string $host,
        int    $port,
        string $version,
        string $bearerToken
    ): string {
        $this->assertPortOpen($host, $port);

        $scheme = $this->detectScheme($host, $port, null, null, $bearerToken);
        $url    = $this->buildUrl($host, $port, $version, 'monitoring/liveness', $scheme);
        $this->get($url, null, null, $bearerToken);

        return $scheme;
    }

    /**
     * Make an authenticated GET request using a persisted StreamServer model.
     */
    public function request(StreamServer $server, string $path): array
    {
        $url = $this->buildUrl(
            $server->server_host_ip,
            (int) $server->api_port,
            $server->api_version,
            ltrim($path, '/')
        );

        if (!empty($server->bearer_token)) {
            $token = EncryptionHelper::decrypt($server->bearer_token);
            return $this->get($url, null, null, $token);
        }

        $password = EncryptionHelper::decrypt($server->password_encrypted);
        return $this->get($url, $server->username, $password, null);
    }

    // ─────────────────────────────────────────────────────────────
    // URL builder
    // ─────────────────────────────────────────────────────────────

    public function buildUrl(
        string $host,
        int    $port,
        string $version,
        string $path,
        string $scheme = 'http'
    ): string {
        $version = ltrim($version, '/');
        $path    = ltrim($path, '/');
        return "{$scheme}://{$host}:{$port}/streamer/api/{$version}/{$path}";
    }

    // ─────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────

    /**
     * Check that TCP port is open before attempting HTTP.
     * Gives a fast, clear error instead of waiting for cURL timeout.
     */
    private function assertPortOpen(string $host, int $port): void
    {
        $socket = @fsockopen($host, $port, $errNo, $errStr, self::SOCKET_TIMEOUT);

        if ($socket === false) {
            throw new Exception(
                "Port {$port} on {$host} is not reachable " .
                "(errno {$errNo}: {$errStr}). " .
                "Verify the IP address, port, and that the server firewall allows this connection."
            );
        }

        fclose($socket);
    }

    /**
     * Try HTTP first, fall back to HTTPS. Returns whichever works.
     * Sends a HEAD-style request to the root ping endpoint.
     */
    private function detectScheme(
        string  $host,
        int     $port,
        ?string $username,
        ?string $password,
        ?string $bearerToken
    ): string {
        foreach (['http', 'https'] as $scheme) {
            $url = "{$scheme}://{$host}:{$port}/streamer/api/v3/monitoring/liveness";
            try {
                $this->get($url, $username, $password, $bearerToken);
                return $scheme;          // first working scheme wins
            } catch (Exception $e) {
                // auth errors (401/403) don't indicate wrong scheme
                if (str_contains($e->getMessage(), 'HTTP 401') ||
                    str_contains($e->getMessage(), 'HTTP 403') ||
                    str_contains($e->getMessage(), 'Authentication failed')) {
                    throw $e;
                }
                // connection error on http → try https
            }
        }

        throw new Exception(
            "Flussonic server at {$host}:{$port} did not respond on http or https. " .
            "Check the port and server configuration."
        );
    }

    private function get(
        string  $url,
        ?string $username,
        ?string $password,
        ?string $bearerToken
    ): array {
        $ch = curl_init($url);

        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => self::REQUEST_TIMEOUT,
            CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS      => 3,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
        ];

        if ($bearerToken !== null) {
            $opts[CURLOPT_HTTPHEADER][] = "Authorization: Bearer {$bearerToken}";
        } elseif ($username !== null && $password !== null) {
            $opts[CURLOPT_USERPWD]  = "{$username}:{$password}";
            $opts[CURLOPT_HTTPAUTH] = CURLAUTH_BASIC;
        }

        curl_setopt_array($ch, $opts);

        $raw      = curl_exec($ch);
        $errNo    = curl_errno($ch);
        $errMsg   = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false || $errNo !== CURLE_OK) {
            throw new Exception($this->describeCurlError($errNo, $errMsg, $url));
        }

        if ($httpCode === 401 || $httpCode === 403) {
            throw new Exception(
                "Authentication failed (HTTP {$httpCode}) — check username / password or bearer token."
            );
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            throw new Exception("Unexpected HTTP {$httpCode} from {$url}");
        }

        return json_decode($raw, true) ?? [];
    }

    private function describeCurlError(int $errno, string $error, string $url): string
    {
        $hints = [
            CURLE_OPERATION_TIMEDOUT   => "Request to {$url} timed out after " . self::REQUEST_TIMEOUT . "s. The server may be slow or blocked by a firewall.",
            CURLE_COULDNT_CONNECT      => "Could not connect to {$url}. The server may be down or the port is wrong.",
            CURLE_COULDNT_RESOLVE_HOST => "Could not resolve the hostname in {$url}. Check the IP / domain.",
            CURLE_SSL_CONNECT_ERROR    => "SSL handshake failed for {$url}.",
        ];

        return $hints[$errno] ?? "cURL error {$errno}: {$error} (URL: {$url})";
    }
}
