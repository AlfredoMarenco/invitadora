<?php

namespace App\Notifications;

use App\Models\Invitation;
use App\Models\Wedding;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GuestRsvpNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Invitation $invitation,
        public Wedding $wedding,
        public array $details = []
    ) {}

    public function via(object $notifiable): array
    {
        // Se puede enviar a la base de datos (para el panel admin) y/o por correo
        $channels = ['database'];

        // Si se invoca sobre una ruta anónima por correo (AnonymousNotifiable) o el notifiable tiene email
        if (!empty($notifiable->routes['mail']) || !empty($notifiable->email)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $bride = $this->wedding->bride_name ?? 'Adriana';
        $groom = $this->wedding->groom_name ?? 'Joaquín';

        $attendingCount = 0;
        $declinedCount = 0;
        $guestItems = [];

        foreach ($this->invitation->guests as $g) {
            if ($g->is_attending === true) {
                $attendingCount++;
            } elseif ($g->is_attending === false) {
                $declinedCount++;
            }
            $guestItems[] = [
                'name' => $g->full_name,
                'is_attending' => $g->is_attending,
                'allergies' => $g->allergies,
                'type' => $g->type,
            ];
        }

        $totalResponded = $attendingCount + $declinedCount;
        $statusSummary = $attendingCount > 0
            ? ($declinedCount === 0 ? "¡Confirmaron asistencia ({$attendingCount})!" : "Confirmación mixta ({$attendingCount} sí, {$declinedCount} no)")
            : "No podrán asistir ({$declinedCount})";

        $subject = "✨ Nueva Confirmación: {$this->invitation->name} — {$bride} & {$groom}";

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.rsvp_notification', [
                'wedding' => $this->wedding,
                'invitation' => $this->invitation,
                'bride' => $bride,
                'groom' => $groom,
                'attendingCount' => $attendingCount,
                'declinedCount' => $declinedCount,
                'guestItems' => $guestItems,
                'statusSummary' => $statusSummary,
                'messageToCouple' => $this->invitation->message_to_couple,
                'dashboardUrl' => url('/admin/invitations'),
            ]);
    }

    public function toDatabase(object $notifiable): array
    {
        $attending = 0;
        $declined = 0;
        $guests = [];

        foreach ($this->invitation->guests as $g) {
            if ($g->is_attending === true) $attending++;
            if ($g->is_attending === false) $declined++;
            $guests[] = [
                'name' => $g->full_name,
                'is_attending' => $g->is_attending,
                'allergies' => $g->allergies,
            ];
        }

        return [
            'invitation_id' => $this->invitation->id,
            'invitation_name' => $this->invitation->name,
            'attending_count' => $attending,
            'declined_count' => $declined,
            'total_guests' => count($this->invitation->guests),
            'has_attending' => $attending > 0,
            'message' => $this->invitation->message_to_couple,
            'guests' => $guests,
            'time' => now()->toIso8601String(),
        ];
    }
}
