# BUGS

- Emails should be CC'ed => need to define "root" email that won't bounce : hello@idea-heroes.com


http://www.theabcofcloud.com/how-to-setup-mongodb-with-lambda-steps/


# TODO
- mission report API
- graphQLize

- manage case wheere there are 100 messages (i.e. retrieve previsou conv page too) + unit test 
- unit test the removal of mission notifs on mission end 

# DONE



## notifications

* delete expired notifs on end :
    - mission notifs on mission end
    - chat & friendship notif on friendship end

* look into typegoose


## email sender

- do rate limiter ! 


# jobs 
- check time spent in job and email if too long 
(see https://stackoverflow.com/questions/5478351/python-time-measure-function) 


# unit tests

- user cnx date 
- mid month invites task 





########## DONE 


* should be read by default (no action):
    - friendship_accepted
    - karma_friend
    - user_liked

* move rewards to seperate conf file

* include unread notif count in firebase payload

