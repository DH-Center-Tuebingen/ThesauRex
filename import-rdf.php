<?php
    $filename = $_FILES['file']['name'];
    $destination = 'uploads/' . $filename;
    move_uploaded_file($_FILES['file']['tmp_name'], $destination);
    $ret = exec('./3rdparty/scripts/skos2sql.py -f ' . escapeshellarg(realpath($destination)), $output);
    //TODO check if ret is an error (msg)
?>
