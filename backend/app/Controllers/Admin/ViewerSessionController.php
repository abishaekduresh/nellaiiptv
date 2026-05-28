<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\Admin\ViewerSessionService;
use App\Helpers\ResponseFormatter;
use App\Helpers\Validator;
use Exception;

class ViewerSessionController
{
    private ViewerSessionService $viewerSessionService;

    public function __construct(ViewerSessionService $viewerSessionService)
    {
        $this->viewerSessionService = $viewerSessionService;
    }

    public function index(Request $request, Response $response): Response
    {
        try {
            $sessions = $this->viewerSessionService->getAll($request->getQueryParams());
            return ResponseFormatter::success($response, $sessions, 'Viewer sessions retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];

        $rules = [
            'required' => [
                ['session_id'],
                ['stream_uuid'],
                ['ip_address'],
            ],
        ];

        $errors = Validator::validate($data, $rules);
        if ($errors) return ResponseFormatter::error($response, 'Validation failed', 400, $errors);

        try {
            $session = $this->viewerSessionService->create($data);
            return ResponseFormatter::success($response, $session, 'Session recorded', 201);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
