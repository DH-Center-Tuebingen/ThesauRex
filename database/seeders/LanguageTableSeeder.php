<?php

namespace Database\Seeders;

use App\ThLanguage;
use App\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LanguageTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $user = User::where('name', 'Admin')->first();

        DB::table('th_language')->delete();

        $de = new ThLanguage();
        $de->user_id = $user->id;
        $de->display_name   = 'Deutsch';
        $de->short_name     = 'de';
        $de->save();
        $en = new ThLanguage();
        $en->user_id = $user->id;
        $en->display_name  = 'English';
        $en->short_name    = 'en';
        $en->save();
    }
}
