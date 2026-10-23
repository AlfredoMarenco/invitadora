<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva Confirmación de Asistencia</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f7f5ed;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Georgia', serif;
            color: #2c302e;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(40, 54, 46, 0.08);
            border: 1px solid #e7dfd1;
        }
        .header {
            background: linear-gradient(135deg, #28362e 0%, #1e2923 100%);
            padding: 36px 24px;
            text-align: center;
            color: #fbf9f4;
            border-bottom: 3px solid #cbb57b;
        }
        .monogram {
            display: inline-block;
            width: 54px;
            height: 54px;
            line-height: 54px;
            border-radius: 50%;
            border: 2px solid #cbb57b;
            font-size: 20px;
            font-weight: bold;
            color: #cbb57b;
            margin-bottom: 12px;
            background-color: rgba(203, 181, 123, 0.1);
        }
        .header-title {
            font-size: 22px;
            letter-spacing: 0.08em;
            margin: 0;
            text-transform: uppercase;
            font-weight: 600;
        }
        .header-subtitle {
            font-size: 13px;
            color: #cbb57b;
            margin-top: 6px;
            letter-spacing: 0.15em;
            text-transform: uppercase;
        }
        .body-content {
            padding: 32px 28px;
        }
        .badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            margin-bottom: 16px;
        }
        .badge-attending {
            background-color: #e8f3ed;
            color: #2b5f3f;
            border: 1px solid #b7dfc7;
        }
        .badge-declined {
            background-color: #fde8e8;
            color: #9b1c1c;
            border: 1px solid #f8b4b4;
        }
        .invitation-name {
            font-size: 24px;
            font-weight: 700;
            color: #28362e;
            margin: 0 0 8px 0;
        }
        .guest-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 20px 0;
            border: 1px solid #e7dfd1;
            border-radius: 10px;
            overflow: hidden;
        }
        .guest-table th {
            background-color: #f9f8f4;
            color: #698175;
            text-align: left;
            padding: 12px 16px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            border-bottom: 1px solid #e7dfd1;
        }
        .guest-table td {
            padding: 12px 16px;
            font-size: 14px;
            border-bottom: 1px solid #f0ede4;
        }
        .guest-table tr:last-child td {
            border-bottom: none;
        }
        .status-pill {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }
        .status-yes {
            background-color: #e8f3ed;
            color: #2b5f3f;
        }
        .status-no {
            background-color: #fde8e8;
            color: #9b1c1c;
        }
        .allergy-alert {
            display: block;
            font-size: 11px;
            color: #b45309;
            margin-top: 4px;
        }
        .message-box {
            background-color: #fbf9f4;
            border-left: 4px solid #cbb57b;
            padding: 16px 20px;
            border-radius: 0 10px 10px 0;
            margin: 24px 0;
            font-style: italic;
            color: #4b5563;
            font-size: 14px;
            line-height: 1.5;
        }
        .cta-container {
            text-align: center;
            margin: 32px 0 16px 0;
        }
        .cta-button {
            display: inline-block;
            background-color: #28362e;
            color: #fbf9f4 !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 30px;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            box-shadow: 0 4px 12px rgba(40, 54, 46, 0.2);
        }
        .footer {
            background-color: #f9f8f4;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #8c9b93;
            border-top: 1px solid #e7dfd1;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Encabezado Brandeado -->
        <div class="header">
            <div class="monogram">
                {{ substr($bride, 0, 1) }}&amp;{{ substr($groom, 0, 1) }}
            </div>
            <h1 class="header-title">{{ $bride }} &amp; {{ $groom }}</h1>
            <div class="header-subtitle">Confirmación de Asistencia</div>
        </div>

        <!-- Contenido Principal -->
        <div class="body-content">
            <div>
                @if($attendingCount > 0)
                    <span class="badge badge-attending">✓ {{ $statusSummary }}</span>
                @else
                    <span class="badge badge-declined">✕ {{ $statusSummary }}</span>
                @endif
            </div>

            <h2 class="invitation-name">{{ $invitation->name }}</h2>
            <p style="margin: 0; font-size: 13px; color: #6b7280;">
                Ha registrado su respuesta el {{ now()->locale('es')->isoFormat('D [de] MMMM [de] YYYY [a las] h:mm A') }}.
            </p>

            <!-- Tabla de Invitados / Acompañantes -->
            <table class="guest-table">
                <thead>
                    <tr>
                        <th>Invitado</th>
                        <th>Asistencia</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($guestItems as $guest)
                        <tr>
                            <td>
                                <strong>{{ $guest['name'] }}</strong>
                                @if(!empty($guest['type']) && $guest['type'] === 'child')
                                    <span style="font-size: 11px; color: #9ca3af;">(Niño/a)</span>
                                @endif
                                @if(!empty($guest['allergies']))
                                    <span class="allergy-alert">⚠️ Alergias/Menú: {{ $guest['allergies'] }}</span>
                                @endif
                            </td>
                            <td>
                                @if($guest['is_attending'] === true)
                                    <span class="status-pill status-yes">✓ Asistirá</span>
                                @elseif($guest['is_attending'] === false)
                                    <span class="status-pill status-no">✕ No asiste</span>
                                @else
                                    <span style="font-size: 12px; color: #9ca3af;">Pendiente</span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <!-- Mensaje emotivo de los invitados si lo dejaron -->
            @if(!empty($messageToCouple))
                <div style="margin-top: 20px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #698175; font-weight: bold; margin-bottom: 6px;">
                        Mensaje para los Novios:
                    </div>
                    <div class="message-box">
                        “{{ $messageToCouple }}”
                    </div>
                </div>
            @endif

            <!-- Botón al panel -->
            <div class="cta-container">
                <a href="{{ $dashboardUrl }}" class="cta-button" target="_blank">
                    Ver en Panel de Invitados →
                </a>
            </div>
        </div>

        <!-- Pie de correo -->
        <div class="footer">
            Notificación automática de tu plataforma de invitaciones • {{ config('app.name', 'Invitadora') }}
        </div>
    </div>
</body>
</html>
