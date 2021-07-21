<?php

use Illuminate\Database\Seeder;

class StandaloneSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $this->call('AdminUserSeeder');
        $this->call('LanguageTableSeeder');
        $this->call('RolesPermissionsSeeder');
    }
}
