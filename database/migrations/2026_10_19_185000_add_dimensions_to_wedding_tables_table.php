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
        Schema::table('wedding_tables', function (Blueprint $table) {
            $table->unsignedSmallInteger('width')->nullable()->after('shape');
            $table->unsignedSmallInteger('height')->nullable()->after('width');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wedding_tables', function (Blueprint $table) {
            $table->dropColumn(['width', 'height']);
        });
    }
};
