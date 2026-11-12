<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventPlannerModifications
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->role === 'wedding_planner') {
            if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                $allowedRoutes = [
                    '*.checkin.scan',
                    '*.checkin.toggle',
                    '*.checkin.toggle-invitation',
                    '*.notifications.read',
                    '*.notifications.mark-all-read',
                    'admin.checkin.scan',
                    'admin.checkin.toggle',
                    'admin.checkin.toggle-invitation',
                    'notifications.read',
                    'notifications.mark-all-read',
                ];

                if (
                    $request->routeIs($allowedRoutes)
                    || ($request->method() === 'PUT' && str_ends_with($request->path(), '/checkin'))
                    || ($request->method() === 'POST' && str_ends_with($request->path(), '/checkin/scan'))
                    || ($request->method() === 'PUT' && str_contains($request->path(), 'admin/notifications/'))
                ) {
                    return $next($request);
                }

                abort(403, 'Acceso denegado. El Wedding Planner no tiene permisos para editar o configurar, solo para controlar el acceso.');
            }
        }

        return $next($request);
    }
}
