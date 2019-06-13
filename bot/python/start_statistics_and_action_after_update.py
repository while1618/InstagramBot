from utils import create_connection
from thread import MyThread

connection = create_connection()
profiles_collection = connection["profiles"]
script_path = '/var/InstagramBot/bot/statistics_and_action_after_update/statistics_and_action_after_update.php'
log_path = '/var/log/InstagramBot/statistics_and_action_after_update/'

profiles = profiles_collection.find({'verifyData.verify': True, 'instagramData.initStatistics': True},
                                    {'_id': 1, 'instagramData': 1, 'config': 1})

for profile in profiles:
    MyThread(profile, script_path, log_path).start()
