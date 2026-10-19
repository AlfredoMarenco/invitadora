<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('weddings', function (Blueprint $table) {
            if (!Schema::hasColumn('weddings', 'gift_registry_button_text')) {
                $table->string('gift_registry_button_text')->nullable()->after('gift_registry_url');
            }
            if (!Schema::hasColumn('weddings', 'gift_registry_url_2')) {
                $table->string('gift_registry_url_2')->nullable()->after('gift_registry_button_text');
            }
            if (!Schema::hasColumn('weddings', 'gift_registry_button_text_2')) {
                $table->string('gift_registry_button_text_2')->nullable()->after('gift_registry_url_2');
            }
            if (!Schema::hasColumn('weddings', 'gift_registries')) {
                $table->json('gift_registries')->nullable()->after('gift_registry_button_text_2');
            }
        });
    }

    public function down(): void
    {
        Schema::table('weddings', function (Blueprint $table) {
            $cols = ['gift_registry_button_text', 'gift_registry_url_2', 'gift_registry_button_text_2', 'gift_registries'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('weddings', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
