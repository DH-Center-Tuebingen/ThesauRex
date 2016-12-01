<?php
    $isTmp = $_POST['isTmp'];
    $root = $_POST['root'];
    $options = "";
    if(isset($isTmp) && $isTmp == 'clone') {
        $options = "-t";
    }
    if(isset($root) && $root > 0) {
        $options .= " -r" $root;
    }
    $ret = shell_exec("./3rdparty/scripts/sql2skos.py" . (strlen($options) > 0 ? " " . $options : ""));
    echo $ret;
    //TODO check if ret is an error (msg)
?>
