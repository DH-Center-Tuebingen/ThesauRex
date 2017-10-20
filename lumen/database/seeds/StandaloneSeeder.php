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
        $this->call('RolesPermissionsSeeder');
        $this->call('AdminUserSeeder');
    }
}
