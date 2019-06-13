import threading
import json
from subprocess import Popen, PIPE
from utils import escapeshellarg


def execute_command(command):
    process = Popen(command, stdout=PIPE, shell=True)
    while True:
        line = process.stdout.readline().rstrip()
        if not line:
            break
        yield line


class MyThread(threading.Thread):
    def __init__(self, profile_data, script_path, log_path):
        threading.Thread.__init__(self)
        self.profile_data = profile_data
        self.script_path = script_path
        self.log_path = log_path

    def run(self):
        for path in execute_command('/usr/bin/php7.2 ' + self.script_path + ' ' + escapeshellarg(
                json.dumps(self.profile_data)) + ' 2>&1 | tee -a ' + self.log_path + self.profile_data[
                                        'instagramData']['instagramUsername'] + '.log'):
            print(path.decode('utf-8'))
