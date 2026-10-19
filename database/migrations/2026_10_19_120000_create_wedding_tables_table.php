<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wedding_tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wedding_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('capacity')->default(10);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::table('guests', function (Blueprint $table) {
            $table->foreignId('table_id')->nullable()->after('table_name')->constrained('wedding_tables')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('guests', function (Blueprint $table) {
            $table->dropForeign(['table_id']);
            $table->dropColumn('table_id');
        });

        Schema::dropIfExists('wedding_tables');
    }
};
