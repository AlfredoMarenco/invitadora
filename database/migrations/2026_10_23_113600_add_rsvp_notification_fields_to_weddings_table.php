<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('weddings', function (Blueprint $table) {
            $table->string('rsvp_notification_email')->nullable()->after('rsvp_deadline');
            $table->boolean('notify_on_rsvp')->default(true)->after('rsvp_notification_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('weddings', function (Blueprint $table) {
            $table->dropColumn(['rsvp_notification_email', 'notify_on_rsvp']);
        });
    }
};
