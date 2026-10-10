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
        Schema::create('weddings', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('bride_name');
            $table->string('groom_name');
            $table->json('bride_parents')->nullable();
            $table->json('groom_parents')->nullable();
            $table->json('bride_godparents')->nullable();
            $table->json('groom_godparents')->nullable();
            $table->dateTime('wedding_date');
            $table->json('locations')->nullable();
            $table->string('gift_registry_url')->nullable();
            $table->text('bank_transfer_info')->nullable();
            $table->string('background_music_path')->nullable();
            $table->string('dress_code')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weddings');
    }
};
