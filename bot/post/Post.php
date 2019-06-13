<?php

class Post {
    private $instagramAPI;
    private $profileId;
    private $config;
    private $postsCollection;
    private $filesCollection;
    private $profilesCollection;
    private $posts;
    private $files;

    private static $filePath = "/var/InstagramBot/uploads/";

    /**
     * Messages constructor.
     * @param $instagramAPI \InstagramAPI\Instagram
     * @param $profileId
     * @param $config
     * @param $posts
     */
    public function __construct($instagramAPI, $profileId, $config, $posts) {
        $this->instagramAPI = $instagramAPI;
        $this->profileId = $profileId;
        $this->config = $config;
        $this->posts = $posts;
        $this->postsCollection = (new DataBase())->getCollection('posts');
        $this->filesCollection = (new DataBase())->getCollection('files');
        $this->profilesCollection = (new DataBase())->getCollection('profiles');
    }

    public function upload() {
        foreach ($this->posts as $post) {
            $this->files = iterator_to_array($this->filesCollection->find(
                ['_id' => ['$in' => $post['fileIds']]]
            ));
            if ($post['postType'] === 'timelinePost') {
                if (count($this->files) > 1) {
                    $this->album($post['additionalPostData']['captionText']);
                } else {
                    $this->timelinePost($post['additionalPostData']['captionText']);
                }
            } else {
                $this->storyPost();
            }
            $this->deletePost($post['_id']);
        }
    }

    private function album($captionText) {
        $media = [];
        foreach ($this->files as $file) {
            $media []= [
                'type' => ($file['isImage']) ? 'photo' : 'video',
                'file' => self::$filePath . $file['_id'] . $file['extensionWithDot']
            ];
        }
        $mediaOptions = [
            'targetFeed' => \InstagramAPI\Constants::FEED_TIMELINE_ALBUM,
            // Uncomment to expand media instead of cropping it.
            'operation' => \InstagramAPI\Media\InstagramMedia::EXPAND,
        ];
        foreach ($media as &$item) {
            $validMedia = null;
            if ($item['type'] === 'photo') {
                $validMedia = new \InstagramAPI\Media\Photo\InstagramPhoto($item['file'], $mediaOptions);
            } else {
                $validMedia = new \InstagramAPI\Media\Video\InstagramVideo($item['file'], $mediaOptions);
            }
            if ($validMedia === null) {
                continue;
            }
            try {
                $item['file'] = $validMedia->getFile();
                // We must prevent the InstagramMedia object from destructing too early,
                // because the media class auto-deletes the processed file during their
                // destructor's cleanup (so we wouldn't be able to upload those files).
                $item['__media'] = $validMedia; // Save object in an unused array key.
            } catch (Exception $e) {
                continue;
            }
            if (!isset($mediaOptions['forceAspectRatio'])) {
                // Use the first media file's aspect ratio for all subsequent files.
                $mediaDetails = $validMedia instanceof \InstagramAPI\Media\Photo\InstagramPhoto
                    ? new \InstagramAPI\Media\Photo\PhotoDetails($item['file'])
                    : new \InstagramAPI\Media\Video\VideoDetails($item['file']);
                $mediaOptions['forceAspectRatio'] = $mediaDetails->getAspectRatio();
            }
        }
        unset($item);

        try {
            $this->instagramAPI->timeline->uploadAlbum($media, ['caption' => $captionText]);
            Utils::logEvent('info', 'Album successfully uploaded to timeline');
            Utils::makePause($this->config['post']['pauseBetweenPost']);
        } catch (Exception $e) {
            Utils::logEvent('error', $e->getMessage());
        }
    }

    private function timelinePost($captionText) {
        try {
            $path = self::$filePath . $this->files[0]['_id'] . $this->files[0]['extensionWithDot'];
            if ($this->files[0]['isVideo']) {
                $video = new \InstagramAPI\Media\Video\InstagramVideo($path);
                $this->instagramAPI->timeline->uploadVideo($video->getFile(), ['caption' => $captionText]);
            } else if ($this->files[0]['isImage']) {
                $photo = new \InstagramAPI\Media\Photo\InstagramPhoto($path);
                $this->instagramAPI->timeline->uploadPhoto($photo->getFile(), ['caption' => $captionText]);
            }
            Utils::logEvent('info', 'Post successfully uploaded to timeline');
            Utils::makePause($this->config['post']['pauseBetweenPost']);
        } catch (Exception $e) {
            Utils::logEvent('error', $e->getMessage());
        }
    }

    private function storyPost() {
        try {
            $path = self::$filePath . $this->files[0]['_id'] . $this->files[0]['extensionWithDot'];
            if ($this->files[0]['isVideo']) {
                $video = new \InstagramAPI\Media\Video\InstagramVideo($path, ['targetFeed' => \InstagramAPI\Constants::FEED_STORY, 'operation' => \InstagramAPI\Media\InstagramMedia::EXPAND]);
                $this->instagramAPI->story->uploadVideo($video->getFile());
            } else if ($this->files[0]['isImage']) {
                $avgColor = PostUtils::average($path);
                $photo = new \InstagramAPI\Media\Photo\InstagramPhoto($path, ['targetFeed' => \InstagramAPI\Constants::FEED_STORY, 'operation' => \InstagramAPI\Media\InstagramMedia::EXPAND, 'bgColor' => $avgColor]);
                $this->instagramAPI->story->uploadPhoto($photo->getFile());
            }
            Utils::logEvent('info', 'Post successfully uploaded to story');
            Utils::makePause($this->config['post']['pauseBetweenPost']);
        } catch (Exception $e) {
            Utils::logEvent('error', $e->getMessage());
        }
    }

    private function deletePost($postId) {
        $this->postsCollection->deleteOne(
            ['_id' => $postId]
        );
        foreach ($this->files as $file) {
            $this->filesCollection->deleteOne(
                ['_id' => $file['_id']]
            );
            shell_exec("rm -rf " . self::$filePath . $file['_id'] . $file['extensionWithDot']);
        }
        Utils::logEvent('info', 'Post with id: ' . $postId . ' deleted');
    }

}