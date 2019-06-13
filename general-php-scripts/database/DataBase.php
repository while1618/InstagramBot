<?php

class DataBase {
    const SERVER_NAME = "localhost";
    const PORT = "3001";
    const DATABASE_NAME = "meteor";

    private $connection;
    private $database;
    private static $numberOfTries = 0;

    public function __construct() {
        try {
            $this->connection = new MongoDB\Client("mongodb://" . self::SERVER_NAME . ":" . self::PORT);
            $this->connection->listDatabases();
            $this->database = $this->connection->selectDatabase(self::DATABASE_NAME);
        } catch (MongoDB\Driver\Exception\ConnectionTimeoutException $e) {
            if (self::$numberOfTries < 3) {
                self::$numberOfTries++;
                Utils::logEvent('DBWarning', 'Number of tries: '. self::$numberOfTries .'. Connection warning: ' . $e->getMessage());
                sleep(120);
                $this->__construct();
            } else {
                Utils::logEvent('DBError', 'Connection error: ' . $e->getMessage());
                Utils::stopProgram();
            }
        }
    }

    public function getCollection($collection) {
        return $this->database->$collection;
    }
}
