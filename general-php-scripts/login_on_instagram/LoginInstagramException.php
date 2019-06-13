<?php

class LoginInstagramException extends Exception {
    const USERNAME_ERROR = 'The username you entered';
    const NEW_USERNAME_MESSAGE = 'Username does not exists';

    const PASSWORD_ERROR = 'The password you entered';
    const NEW_PASSWORD_MESSAGE = 'Password is not correct';

    public function __construct($message) {
        parent::__construct($message);
        $this->changeMessage();
    }

    private function changeMessage() {
        $this->checkForError(self::USERNAME_ERROR, self::NEW_USERNAME_MESSAGE);
        $this->checkForError(self::PASSWORD_ERROR, self::NEW_PASSWORD_MESSAGE);
    }

    private function checkForError($error, $newMessage) {
        if (strpos($this->message, $error) !== false)
            $this->message = $newMessage;
    }

}