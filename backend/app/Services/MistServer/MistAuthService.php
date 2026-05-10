<?php

namespace App\Services\MistServer;

use App\Helpers\EncryptionHelper;
use App\Models\StreamServer;

/**
 * MistServer API authentication service.
 *
 * Official auth flow  (ref: https://docs.mistserver.org/mistserver/integration/api/authentication/)
 * ─────────────────
 * 1. POST /api2  {"authorize": {"username": "admin", "password": ""}}
 *    → response: {"authorize": {"status": "CHALL", "challenge": "xxxxx"}}
 *
 * 2. Compute hash:
 *    MD5( MD5(password) + challenge )
 *    ─ inner hash is MD5 of the plaintext password only (no username)
 *    ─ challenge is appended AFTER the inner hash
 *
 * 3. POST /api2  {"authorize": {"username": "admin", "password": "<hash>"}, ...payload}
 *    → response: {"authorize": {"status": "OK"}, ...}
 *
 * No cookies or sessions are used — MistServer binds the challenge to the
 * client IP address, so both steps work without any cookie jar.
 */
class MistAuthService
{
    private const CONNECT_TIMEOUT = 5;  // seconds to establish connection
    private const REQUEST_TIMEOUT = 10; // seconds for full request

    // ──────────────────────────────────────────────────────────────
    // Public API
    // ──────────────────────────────────────────────────────────────

    /**
     * Send an authenticated request to a persisted StreamServer.
     * The stored password is decrypted automatically.
     *
     * @return array Full MistServer API response
     */
    public function authenticatedRequest(StreamServer $server, array $payload): array
    {
        $plainPassword = EncryptionHelper::decrypt($server->mist_server_password);

        $result = $this->performAuthenticatedRequest(
            $server->mist_api_protocol,
            $server->mist_api_host,
            (int) $server->mist_api_port,
            (bool) $server->ssl_enabled,
            $server->mist_server_username,
            $plainPassword,
            $payload
        );

        return $result['response'];
    }

    /**
     * Validate MistServer credentials WITHOUT a persisted model.
     * Used during create / update to confirm creds before saving.
     *
     * Returns the challenge and final hash so they can be persisted
     * alongside the encrypted password in the stream_servers table.
     *
     * @return array{challenge: string, final_hash: string}
     * @throws \RuntimeException if credentials are invalid or server unreachable
     */
    public function validateCredentials(
        string $protocol,
        string $host,
        int    $port,
        bool   $sslEnabled,
        string $username,
        string $plainPassword
    ): array {
        $result = $this->performAuthenticatedRequest(
            $protocol, $host, $port, $sslEnabled,
            $username, $plainPassword,
            []
        );

        return [
            'challenge'  => $result['challenge'],
            'final_hash' => $result['final_hash'],
        ];
    }

    // ──────────────────────────────────────────────────────────────
    // Core logic
    // ──────────────────────────────────────────────────────────────

    /**
     * @return array{response: array, challenge: string, final_hash: string}
     */
    private function performAuthenticatedRequest(
        string $protocol,
        string $host,
        int    $port,
        bool   $sslEnabled,
        string $username,
        string $plainPassword,
        array  $payload
    ): array {
        $url = sprintf('%s://%s:%d/api2', $protocol, $host, $port);

        // ── Step 1: request challenge ─────────────────────────────
        // Include username + empty password so MistServer knows which
        // account to generate the challenge for.
        $challengeResp = $this->post($url, [
            'authorize' => ['username' => $username, 'password' => ''],
        ], $sslEnabled);

        $challenge = $challengeResp['authorize']['challenge'] ?? null;
        $status    = $challengeResp['authorize']['status']    ?? null;

        if (empty($challenge) || $status !== 'CHALL') {
            throw new \RuntimeException(
                "MistServer did not issue a challenge (status: {$status}, host: {$host}:{$port})"
            );
        }

        // ── Step 2: compute hash ───────────────────────────────────
        // Formula: MD5( MD5(password) + challenge )
        $finalHash = md5(md5($plainPassword) . $challenge);

        // ── Step 3: authenticated request ─────────────────────────
        $body = array_merge(
            ['authorize' => ['username' => $username, 'password' => $finalHash]],
            $payload
        );

        $response   = $this->post($url, $body, $sslEnabled);
        $authStatus = $response['authorize']['status'] ?? 'UNKNOWN';

        if ($authStatus !== 'OK') {
            throw new \RuntimeException(
                "MistServer authentication failed (status: {$authStatus}, host: {$host}:{$port}). Check username / password."
            );
        }

        return [
            'response'   => $response,
            'challenge'  => $challenge,
            'final_hash' => $finalHash,
        ];
    }

    // ──────────────────────────────────────────────────────────────
    // HTTP transport
    // ──────────────────────────────────────────────────────────────

    private function post(string $url, array $data, bool $sslEnabled): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($data),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
            CURLOPT_TIMEOUT        => self::REQUEST_TIMEOUT,
            CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT,
            CURLOPT_SSL_VERIFYPEER => $sslEnabled,
            CURLOPT_SSL_VERIFYHOST => $sslEnabled ? 2 : 0,
        ]);

        $raw       = curl_exec($ch);
        $curlErrNo = curl_errno($ch);
        $curlErr   = curl_error($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false) {
            throw new \RuntimeException(
                "Cannot reach MistServer at {$url}: " . $this->describeError($curlErrNo, $curlErr)
            );
        }

        $decoded = json_decode($raw, true);

        if (!is_array($decoded)) {
            throw new \RuntimeException(
                "MistServer returned non-JSON response (HTTP {$httpCode}) from {$url}"
            );
        }

        return $decoded;
    }

    private function describeError(int $errno, string $error): string
    {
        $map = [
            CURLE_OPERATION_TIMEDOUT   => 'connection timed out',
            CURLE_COULDNT_CONNECT      => 'could not connect (server down or wrong port)',
            CURLE_COULDNT_RESOLVE_HOST => 'could not resolve host',
            CURLE_SSL_CONNECT_ERROR    => 'SSL handshake failed',
        ];

        return $map[$errno] ?? $error;
    }
}
