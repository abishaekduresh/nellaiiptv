<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\CustomerService;
use App\Helpers\ResponseFormatter;
use App\Helpers\Validator;
use Exception;

class CustomerController
{
    private $customerService;

    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
    }

    public function getProfile(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        try {
            $customer = $this->customerService->getProfile($user->sub);
            return ResponseFormatter::success($response, $customer, 'Profile retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 404);
        }
    }

    public function updateProfile(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $data = $request->getParsedBody() ?? [];

        $errors = Validator::validate($data, [
            'optional' => [['name'], ['phone']],
            'integer' => [['phone']]
        ]);

        if ($errors) {
            return ResponseFormatter::error($response, 'Validation failed', 400, $errors);
        }

        try {
            $customer = $this->customerService->updateProfile($user->sub, $data);
            return ResponseFormatter::success($response, $customer, 'Profile updated successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    public function delete(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        try {
            $this->customerService->deleteCustomer($user->sub);
            return ResponseFormatter::success($response, null, 'Account deleted successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }
}
