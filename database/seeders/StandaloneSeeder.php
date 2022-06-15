<?php

namespace Database\Seeders;

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
        $this->call(RolesPermissionsSeeder::class);
        $this->call(AdminUserSeeder::class);
        $this->call(LanguageTableSeeder::class);
    }
}
