<?php

use App\User;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddUserNickname extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Only add nickname column if not already added by Spacialist
        if(!is_part_of_spacialist() && !Schema::hasColumn('users', 'nickname'))
        {
            $users = User::all();
            Schema::table('users', function (Blueprint $table) {
                $table->text('nickname')->nullable();
            });

            foreach($users as $u) {
                $u->nickname = Str::lower(Str::before($u->name, ' '));
                $u->save();
            }

            Schema::table('users', function (Blueprint $table) {
                $table->text('nickname')->nullable(false)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if(!is_part_of_spacialist()) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('nickname');
            });
        }
    }
}
