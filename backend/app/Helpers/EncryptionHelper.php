<?php

namespace App\Helpers;

/**
 * AES-256-CBC encryption helper.
 * Stored format: base64( randomIV[16 bytes] + ciphertext )
 * Key source   : MIST_ENCRYPTION_KEY env variable (min 32 chars recommended)
 */
class EncryptionHelper
{
    private const CIPHER    = 'AES-256-CBC';
    private const IV_LENGTH = 16;

    public static function encrypt(string $plaintext): string
    {
        $key = self::key();
        $iv  = random_bytes(self::IV_LENGTH);

        $ciphertext = openssl_encrypt($plaintext, self::CIPHER, $key, OPENSSL_RAW_DATA, $iv);

        if ($ciphertext === false) {
            throw new \RuntimeException('Encryption failed: ' . openssl_error_string());
        }

        return base64_encode($iv . $ciphertext);
    }

    public static function decrypt(string $encoded): string
    {
        $key  = self::key();
        $data = base64_decode($encoded, true);

        if ($data === false || strlen($data) < self::IV_LENGTH + 1) {
            throw new \RuntimeException('Decryption failed: invalid encoded value');
        }

        $iv         = substr($data, 0, self::IV_LENGTH);
        $ciphertext = substr($data, self::IV_LENGTH);

        $plaintext = openssl_decrypt($ciphertext, self::CIPHER, $key, OPENSSL_RAW_DATA, $iv);

        if ($plaintext === false) {
            throw new \RuntimeException('Decryption failed: ' . openssl_error_string());
        }

        return $plaintext;
    }

    /**
     * Heuristic: a raw plaintext password will never decode from base64
     * to >= 17 bytes cleanly, so this is safe enough as a guard.
     */
    public static function isEncrypted(string $value): bool
    {
        $decoded = base64_decode($value, true);
        return $decoded !== false && strlen($decoded) > self::IV_LENGTH;
    }

    private static function key(): string
    {
        $raw = $_ENV['MIST_ENCRYPTION_KEY']
            ?? getenv('MIST_ENCRYPTION_KEY')
            ?? $_SERVER['MIST_ENCRYPTION_KEY']
            ?? null;

        if (empty($raw)) {
            throw new \RuntimeException('MIST_ENCRYPTION_KEY is not set in environment');
        }

        // Pad / truncate to exactly 32 bytes for AES-256
        return substr(str_pad($raw, 32, "\0"), 0, 32);
    }
}
