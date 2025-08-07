<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use Database\Seeders\Tests\TestUserSeeder;
use Database\Seeders\Tests\TestConceptSeeder;


class TestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $this->call([
            PreferencesSeeder::class,
            StandaloneSeeder::class,
            TestUserSeeder::class,
            TestConceptSeeder::class,
        ]);
    }
}
