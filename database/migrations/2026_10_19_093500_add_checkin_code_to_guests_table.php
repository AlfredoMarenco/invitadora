<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Guest;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('guests', function (Blueprint $table) {
            $table->string('checkin_code', 16)->nullable()->unique()->after('invitation_id');
            $table->timestamp('checked_in_at')->nullable()->after('has_entered');
            $table->index(['checkin_code', 'has_entered']);
        });

        // Generar códigos únicos para todos los invitados ya existentes
        $guests = Guest::all();
        $chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        foreach ($guests as $guest) {
            if (empty($guest->checkin_code)) {
                do {
                    $code = 'AJ-' . substr(str_shuffle(str_repeat($chars, 5)), 0, 5);
                } while (Guest::where('checkin_code', $code)->exists());

                $guest->checkin_code = $code;
                $guest->save();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guests', function (Blueprint $table) {
            $table->dropIndex(['checkin_code', 'has_entered']);
            $table->dropColumn(['checkin_code', 'checked_in_at']);
        });
    }
};
