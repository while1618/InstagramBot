from utils import create_connection
from thread import MyThread

connection = create_connection()
profiles_collection = connection["profiles"]
script_path = '/var/InstagramBot/bot/post/post.php'
log_path = '/var/log/InstagramBot/post/'

profiles = profiles_collection.find({'verifyData.verify': True, 'config.profile.numberOfDays': {'$gt': 0}},
                                    {'_id': 1, 'instagramData': 1, 'config': 1})

for profile in profiles:
    MyThread(profile, script_path, log_path).start()
