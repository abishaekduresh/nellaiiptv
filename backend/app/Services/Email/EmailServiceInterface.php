<?php

namespace App\Services\Email;

interface EmailServiceInterface
{
    public function send(string $to, string $subject, string $html): bool;
}
