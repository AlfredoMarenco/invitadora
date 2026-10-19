<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('weddings', function (Blueprint $table) {
            if (!Schema::hasColumn('weddings', 'song_title')) {
                $table->string('song_title')->nullable()->after('background_audio_path');
            }
            if (!Schema::hasColumn('weddings', 'song_artist')) {
                $table->string('song_artist')->nullable()->after('song_title');
            }
        });
    }

    public function down(): void
    {
        Schema::table('weddings', function (Blueprint $table) {
            if (Schema::hasColumn('weddings', 'song_title')) {
                $table->dropColumn(['song_title']);
            }
            if (Schema::hasColumn('weddings', 'song_artist')) {
                $table->dropColumn(['song_artist']);
            }
        });
    }
};
