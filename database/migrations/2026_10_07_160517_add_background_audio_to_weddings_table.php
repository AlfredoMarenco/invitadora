<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table("weddings", function (Blueprint $table) {
            $table->string("background_audio_path")->nullable()->after("gift_registry_url");
        });
    }

    public function down(): void
    {
        Schema::table("weddings", function (Blueprint $table) {
            $table->dropColumn("background_audio_path");
        });
    }
};
