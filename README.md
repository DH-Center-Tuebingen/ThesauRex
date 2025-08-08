<p>
    <a href='https://david-dm.org/DH-Center-Tuebingen/ThesauRex'>
        <img src='https://david-dm.org/DH-Center-Tuebingen/ThesauRex.svg' alt='Dependency Status' />
    </a>
    <a href='https://opensource.org/licenses/MIT'>
        <img src='https://img.shields.io/badge/License-MIT-yellow.svg' alt='License: MIT' />
    </a>
</p>

# ThesauRex
ThesauRex is a leightweight, easy to use [SKOS](https://www.w3.org/2004/02/skos/) editor.

## Features
- Import/export SKOS files in **RDF** (XML) format
  - Import and export the whole thesaurus tree
  - Import and export subtrees of the thesaurus tree
- Create, edit and delete labels (**prefLabels**, **altLabels**) and **Narrower**/**Broader**
- Drag&drop support for **concepts**
- Drag&drop support to create a new thesaurus

## Installation
Installation procedures and system requirements are described [here](INSTALL.md).

## Testing
Thesaurex is using _Laravel Dusk_ for end-to-end testing. The test files can be found in `tests/Browser`
to run the tests execute the following command:

```shell
php artisan dusk
``` 

If you want to run a single test, you can specify that test with the path variable:

```shell
php artisan dusk .\tests\Browser\BasicTest.php
```

You can also filter for single tests by setting the `filter`flag:

```shell
php artisan dusk .\tests\Browser\BasicTest.php --filter="testBasicBrowserConnection"
```

## Acknowledgments

Development of Spacialist is co-funded by the Ministry of Science, Research and the Arts Baden-Württemberg in the "E-Science" funding programme.
