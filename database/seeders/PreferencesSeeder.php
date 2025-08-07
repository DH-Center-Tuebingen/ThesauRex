<?php
namespace Database\Seeders;

use App\Preference;
use Illuminate\Database\Seeder;

class PreferencesSeeder extends Seeder
{
    public function run()
    {
        $defaultPrefs = [
            [
                'label'         => 'prefs.gui-language',
                'default_value' => json_encode(['language_key' => 'en']),
            ],
            [
                'label'         => 'prefs.link-to-spacialist',
                'default_value' => json_encode(['url' => '']),
            ],
            [
                'label'         => 'prefs.project-name',
                'default_value' => json_encode(['name' => 'Spacialist']),
            ],
            [
                'label'         => 'prefs.enable-password-reset-link',
                'default_value' => json_encode(['use' => false]),
            ],
            [
                'label'         => 'prefs.import-config',
                'default_value' => json_encode([
                    'ignore_missing_labels'    => false,
                    'skip_missing_labels'      => false,
                    'ignore_missing_languages' => false,
                    'ignore_missing_relations' => false,
                ]),
            ],
        ];
        
        foreach($defaultPrefs as $dp) {
            $prefExists = Preference::where('label', $dp['label'])->exists();
            if(!$prefExists) {
                $p                = new Preference();
                $p->label         = $dp['label'];
                $p->default_value = $dp['default_value'];
                $p->save();
            }
        }
    }
}
