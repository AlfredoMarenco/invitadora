<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wedding_tables', function (Blueprint $table) {
            $table->float('pos_x')->default(150)->after('capacity');
            $table->float('pos_y')->default(150)->after('pos_x');
            $table->string('shape', 20)->default('round')->after('pos_y'); // 'round', 'rectangular', 'head'
            $table->smallInteger('rotation')->default(0)->after('shape'); // 0, 45, 90, 180...
        });
    }

    public function down(): void
    {
        Schema::table('wedding_tables', function (Blueprint $table) {
            $table->dropColumn(['pos_x', 'pos_y', 'shape', 'rotation']);
        });
    }
};
