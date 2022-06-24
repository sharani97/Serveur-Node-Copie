#!/usr/bin/python3.5
# -*- coding: utf-8 -*-

#from __future__ import unicode_literals
#import sys
#sys.path.insert(1, '/Library/Python/2.7/site-packages')

import csv
import arrow
import re
import date_utils

import api
mode = "dev"
#mode = "prod"
api.setmode(mode)

usrs = api.get('users')

ressource = 'milestones'
items = api.get(ressource)

for itm in items:
    if itm['state'] != 'paid':
        print(itm['date'], itm['state'])
