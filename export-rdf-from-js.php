<?php
    $data = $_POST['data'];
    $locale = 'de_DE.UTF-8';
    setlocale(LC_ALL, $locale);
    putenv('LC_ALL='.$locale);
    $ret = shell_exec("echo '" . $data . "' | ./3rdparty/scripts/js2skos.py");
    echo $ret;
?>
