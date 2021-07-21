<?php

use App\User;
use Illuminate\Database\Seeder;

class LanguageTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $admin = User::where('name', 'Admin')->first();
        DB::table('th_language')->delete();
        DB::table('th_language')->insert(array(
            'user_id'    => $admin->id,
            'display_name'  => 'Deutsch',
            'short_name'    => 'de'
        ));
        DB::table('th_language')->insert(array(
            'user_id'    => $admin->id,
            'display_name'  => 'English',
            'short_name'    => 'en'
        ));
        DB::table('th_language')->insert(array(
            'user_id'    => $admin->id,
           'display_name'  => 'Español',
           'short_name'    => 'es'
        ));
        DB::table('th_language')->insert(array(
            'user_id'    => $admin->id,
            'display_name'  => 'Français',
            'short_name'    => 'fr'
        ));
        DB::table('th_language')->insert(array(
            'user_id'    => $admin->id,
            'display_name'  => 'Italiano',
            'short_name'    => 'it'
        ));
    }
}
