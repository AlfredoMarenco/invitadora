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
                // Permitir al planner hacer check-in (PUT a /admin/guests/{guest}/checkin)
                if ($request->method() === 'PUT' && str_ends_with($request->path(), '/checkin')) {
                    return $next($request);
                }
                abort(403, 'Acceso denegado. El Wedding Planner no tiene permisos para editar o configurar, solo para controlar el acceso.');
            }
        }

        return $next($request);
    }
}
