<?php

namespace Database\Seeders\Tests;

use App\ThConcept;
use App\User;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestConceptSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $concepts = [
            [
                'labels' => [
                    'en' => 'shape',
                    'de' => 'Form',
                ],
            ], [
                'labels' => [
                    'en' => 'color',
                    'de' => 'Farbe',
                ],
                'children' => [
                    [
                        'labels' => [
                            'en' => 'red',
                            'de' => 'Rot',
                        ]
                    ],
                ]
            ],[
               'labels' => [
                    'en' => 'rgb',
                    'de' => 'RGB',
                ],
                'children' => [
                    [
                        'ref' => 'red'
                    ],[
                        'labels' => [
                            'en' => 'green',
                            'de' => 'Grün',
                        ],
                        'children' => [
                            [
                                'labels' => [
                                    'en' => 'lime green',
                                    'de' => 'Limettengrün',
                                ]
                            ]
                        ]
                    ],[
                        'labels' => [
                            'en' => 'blue',
                            'de' => 'Blau',
                        ]
                    ]      
                ]
            ]
        ];
        $this->addConcepts($concepts);
    }
    
    function addConcepts($concepts, $parentId = null) {
        $admin = User::findOrFail(1);
        
        foreach($concepts as $concept) {
            $labels = $concept['labels'] ?? [];
            // Get key and values from labels
            
            if(isset($concept['ref'])) {
                $matches = ThConcept::getByLabel($concept['ref']);
                
                if(count($matches) === 0) {
                    throw new \Exception("Concept not found for label: " . $concept['ref']);
                }
                
                if(count($matches) > 1) {
                    throw new \Exception("Multiple concepts found for label: " . $concept['ref']);
                }
                
                $conceptObj = $matches[0];
                if($parentId){
                    $conceptObj->addBroader($parentId, true);
                }else{
                    $conceptObj->is_top_concept = true;
                    $conceptObj->saveQuietly();
                }
            } else {
                $conceptObj = null;
                foreach($labels as $lang => $label) {
                    $langId = $lang === 'de' ? 1 : 2;
                    if(!$conceptObj){
                        $conceptObj = ThConcept::create($admin, $label, $langId, $parentId, $parentId === null, true);
                    } else {
                        $conceptObj->addLabel($admin, $label, $langId, true);
                    }
                }
            }
            
            if($conceptObj === null) {
                throw new \Exception("Concept could not be created: " . json_encode($concept));
            }
            
            $children = $concept['children'] ?? [];
            if(!empty($children)) {
                $this->addConcepts($children, $conceptObj->id);
            }
        }
    }
}
