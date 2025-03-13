/**
 * This is a postinstall script to link all 
 * required modules to the project, for as long as those
 * modules are not yet published to npm.
 * As each install removes those links.
 */
import { execSync } from 'child_process';

const modules = [
    'dhc-components',
    'dhc-utils',
];

const linkModules = async () => {
    for(const module of modules) {
        console.log(`Linking ${module}...`);
        execSync(`npm link ${module}`);
    }
};

try{
    linkModules();
}catch(e){
    console.error(e);
}