<?php

class PostUtils {

    public static function getPosts($profileId) {
        $postsCollection = (new DataBase())->getCollection('posts');
        return $postsCollection->find(
            ['profile' => $profileId, 'whenToPost' => ['$lt' => new MongoDB\BSON\UTCDateTime()]]
        )->toArray();
    }

    public static function average($imagePath) {
        if(exif_imagetype($imagePath) == IMAGETYPE_PNG) {
            $imagePath = PostUtils::png2jpg($imagePath);
        }
        $im = imagecreatefromjpeg($imagePath);

        $w = imagesx($im);
        $h = imagesy($im);
        $r = $g = $b = 0;
        for($y = 0; $y < $h; $y++) {
            for($x = 0; $x < $w; $x++) {
                $rgb = imagecolorat($im, $x, $y);
                $r += $rgb >> 16;
                $g += $rgb >> 8 & 255;
                $b += $rgb & 255;
            }
        }
        $pxls = $w * $h;
        $r = dechex(round($r / $pxls));
        $g = dechex(round($g / $pxls));
        $b = dechex(round($b / $pxls));
        if(strlen($r) < 2) {
            $r = 0 . $r;
        }
        if(strlen($g) < 2) {
            $g = 0 . $g;
        }
        if(strlen($b) < 2) {
            $b = 0 . $b;
        }

        $r = hexdec($r);
        $g = hexdec($g);
        $b = hexdec($b);
        $avg = [$r, $g, $b];

        return $avg;
    }

    private static function png2jpg($originalFile) {
        $outputFile = substr($originalFile, 0, -4) . ".jpeg";
        $image = imagecreatefrompng($originalFile);
        imagejpeg($image, $outputFile, 95);
        imagedestroy($image);

        return $outputFile;
    }

}