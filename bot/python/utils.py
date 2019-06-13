import pymongo
import sys


def escapeshellarg(arg):
    return "\\'".join("'" + p + "'" for p in arg.split("'"))


def create_connection():
    server_name = 'localhost'
    port = '3001'
    db_name = 'meteor'
    max_server_selection_delay = 5
    try:
        client = pymongo.MongoClient("mongodb://" + server_name + ":" + port + "/",
                                     serverSelectionTimeoutMS=max_server_selection_delay)
        client.server_info()
        return client[db_name]
    except pymongo.errors.ServerSelectionTimeoutError as err:
        sys.exit(err)
