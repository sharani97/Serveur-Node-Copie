FORMAT: 1A

# Blueprint Test API
Test of blueprint documentation system

## API Blueprint
More bla bla ?


# Data Structures
## LoggedInUser
+ jwt:dmpooeiuzeiuyriuzyeiruyiuezyriueyriueyr (string)
    the jwt that needs to be included in the header

+ roles:user, orgadmin (array[string])
+ adminorgs: 161711919171 (array[string])
    the orgs the user is admin of


# Group Orgs
## Org [/orgs/{id}]
An org represents an organisational structure which hosts missions

+ Attributes (object)
    + name: Org Name (string, required)
    + created: `2014-11-11T08:40:51.620Z` (required)
    + updated: `2014-11-11T08:40:51.620Z` (required)
    + lowername: org_name (string, required) - lowercase version of name to check for doubles
    + members: ['1415203908','1415203847'] (array[string]) - An array of org members
    + admins: ['1415203847'] (array[string]) - An array of org admins
    + max_mission_number: 5 (number) - The max number of users that can be added in org
    + max_user_number: 5 (number) - the max number of missions that can be created in org

+ Parameters
    + id (string)
        The ObjectId of the org

### Get an Org [GET]
+ Response 200 (application/json)
    + Attributes (Org)

### Update an Org [PUT]
+ Request (application/json)
    + Attributes
        + name: Org Name (string, required)
        + description: Org description (string)
        + max_mission_nb: 5 (number) - this can only be updated by admins
        + max_user_nb: 5 (number) - this can only be updated by admins

+ Response 200 (application/json)
    + Attributes (Org)

## Get Org User Count [GET /orgs/{id}/usercount]
+ Parameters
    + id (string)
        The ObjectId of the org

+ Response 200 (application/json)
    + Attributes
        + count: 42 (number) - the number of users in org

## PromoteSeveral [POST /orgs/{id}/promote/]
+ Parameters
    + id (string)
        The ObjectId of the org

+ Request (application/json)
    + Attributes
        + emails: bob@goodboy.org (array[string])

+ Response 200 (application/json)
    + Attributes (Org)

## DemoteSeveral [POST /orgs/{id}/demote/]
+ Parameters
    + id (string)
        The ObjectId of the org

+ Request (application/json)
    + Attributes
        + emails: bob@badboy.org (array[string])

+ Response 200 (application/json)
    + Attributes (Org)

## DemoteOne [PUT /orgs/{id}/demote/{email}]
+ Parameters
    + id (string)
        The ObjectId of the org
    + email: bob@badboy.org (string)
        The Email of the promotee

+ Response 200 (application/json)
    + Attributes (Org)



## PromoteOne [PUT /orgs/{id}/promote/{email}]
+ Parameters
    + id (string)
        The ObjectId of the org
    + email (string)
        The Email of the promotee

+ Response 200 (application/json)
    + Attributes (Org)

## Orgs Collection [/orgs]

### List All Orgs [GET]
+ Response 200 (application/json)
    + Attributes (array[Org])

### Create New Orgs [POST]
+ name (string) - The org name

+ Request (application/json)
    + Attributes
        + name: Org Name (string, required)
        + description: Org description (string)
        + email_admin: bob@test.org, jim@test.org (array[string])
            A collection of emails of users who will be promoted to org admin


+ Response 200 (application/json)
    + Attributes (Org)

# Group Groups

## Group [/groups/{id}]
An groups is a glorified mailing list : it just contains people

+ Attributes (object)
    + name: Group Name (string, required)
    + org: 191981981981 (string, required) - org the group is attached to
    + created: `2014-11-11T08:40:51.620Z` (required)
    + updated: `2014-11-11T08:40:51.620Z` (required)
    + description: this is a group description (string) - useful description (or not)
    + members: ['1415203908','1415203847'] (array[string]) - An array of group members

+ Parameters
    + id (string)
        The ObjectId of the group

## Get Group [GET]
+ Response 200 (application/json)
    + Attributes (Group)

## Create Group [POST]
+ Request (application/json)
    + Attributes
        + name: Group Name (string, required)
        + description: Group description (string)
        + org: 156176191981 (string, required) - The org the group belongs to
        + invitees: bob@test.org, jim@test.org (array[string])
            A collection of emails of users who will be added to the group

+ Response 200 (application/json)
    + Attributes (Group)

## Group invite [PUT /groups/{id}/invite]
+ Parameters
    + id (string)
        The ObjectId of the group

+ Request (application/json)
    + Attributes
        + invitees: bob@test.org, jim@test.org (array[string])
            A collection of emails of users who will be added to the group

+ Response 200 (application/json)
    + Attributes (Group)

## Group members [GET /groups/{id}/members]
+ Parameters
    + id (string)
        The ObjectId of the group

+ Response 200 (application/json)
    + Attributes (array[User])


# Group Mission

## Mission [/missions/{id}]
+ Parameters
    + id (string)
        The ObjectId of the mission

+ Attributes (object)
    + name: Group Name (string, required)
    + org: 191981981981 (string, required) - org the group is attached to
    + created: `2014-11-11T08:40:51.620Z` (string)
    + updated: `2014-11-11T08:40:51.620Z` (string)
    + description: this is a missions description (string) - useful description (or not)
    + members: ['1415203908','1415203847'] (array[string]) - An array of group members
    + start_date: `2014-11-11T08:40:51.620Z` (string)
    + end_date: `2014-11-11T08:40:51.620Z` (string)
    + end_submit_date: `2014-11-11T08:40:51.620Z` (string)
    + end_vote_date: `2014-11-11T08:40:51.620Z` (string)
    + phase1:
        + type (object)
            + start:`2014-11-11T08:40:51.620Z` (string)
            + end :`2014-11-12T08:40:51.620Z` (string)
            + active: true (boolean)
            + state: 
                + type (enum[string])
                    + Default: `pending`
                    + Members
                        + `pending` - phase is waiting for activation
                        + `ready` - phase is ready to go
                        + `closed` - phase has been closed
            + status: 
                + type (enum[string])
                    + Default: `wip`
                    + Members
                        + `wip` - mission is being edited
                        + `locked` - mission is published and ready to go
                        + `finished` - mission end date has passed
                        + `closed` - mission has been closed post end date and any final manual actions have been completed, e.g. choosing a winner
                        + `cancelled`- mission has been cancelled manually

### GetMission [GET]
+ Response 200 (application/json)
    + Attributes (Mission)

### CreateMission [POST]
+ Request (application/json)
    + Header
    + Attributes
        + name: Group Name (string, required)
        + org: 191981981981 (string, required) - org the group is attached to
        + description: this is a mission description (string) - useful description (or not)
        + start_date: `2014-11-11T08:40:51.620Z` (string) - default to now + 1 day
        + end_date: `2014-11-11T08:40:51.620Z` (string) - default to now + 36 days
        + end_submit_date: `2014-11-11T08:40:51.620Z` (string) - default to now + 8 days
        + end_vote_date: `2014-11-11T08:40:51.620Z` (string) - default to now + 15 days
        + groups: 18817181, 1616161718181 (array[string])
            A collection of groups of users who will be added to the mission
        + status:`wip` - specify status of mission, i.e. "wip" or "locked". Locked missions are published and visible for players, wip missions are not. 


+ Response 200 (application/json)
    + Attributes (Mission)


## Mission Members [PUT /missions/{id}/complete/{nb}]
+ Parameters
    + id (string)
        The ObjectId of the mission
    + nb (number)
        The mission phase 

+ Request (application/json)
    + Attributes (object)
        + ideas: 5a3b8cb9e49e62159b120131 (array[string])

+ Response 200 (application/json)
    + Attributes (Mission)

## Mission Members [/missions/{id}/members]
+ Parameters
    + id (string)
        The ObjectId of the mission

### GetMembers [GET]
+ Response 200 (application/json)
    + Attributes (array[User])

### AddMembers [PUT]
+ Request (application/json)
    + Attributes (object)
        + emails: bob@badboy.org (array[string])

+ Response 200 (application/json)
    + Attributes (Mission)


### RemoveMembers [DELETE]
+ Request (application/json)
    + Attributes (object)
        + emails: bob@badboy.org (array[string])

+ Response 200 (application/json)
    + Attributes (Mission)


# Group Ideas

## Idea [/ideas/{idea_id}]
+ Parameters
    + idea_id (string)
        The idea's ObjectId

+ Attributes (object)
    + title: the idea title (string, required)
    + description: idea's description (string)
    + creator_id: the creating user
    + mission_id: the idea to which the mission relates (string, required)
    + created: `2014-11-11T08:40:51.620Z` (string)
    + updated: `2014-11-11T08:40:51.620Z` (string)

### Get Idea [GET]
+ Response 200 (application/json)
    + Attributes (Idea)

### Update Idea [PUT]
+ Response 200 (application/json)
    + Attributes (Idea)

## Vote on Idea [POST /ideas/{idea_id}/vote/{nb}]
You can only vote on an idea when the mission phase is appropriate, i.e. after the end_submit_date and before the end_vote_date

+ Parameters
    + idea_id (string)
        The idea's ObjectId
    + nb - 0 (number)
        The vote

+ Response 200 (application/json)
    + Attributes (Vote)

# Group Votes

## Vote [/votes/{vote_id}]
+ Parameters
    + vote_id (string)
        The vote's ObjectId

+ Attributes (object)
    + target_id: what the vote bears on, e.g. the idea id (string, required)
    + vote_nb: 0 - a number expressing the vote. Can be negative of bigger than 1 (string)
    + voter_id: the creating user
    + created: `2014-11-11T08:40:51.620Z` (string)
    + updated: `2014-11-11T08:40:51.620Z` (string)

### Get Vote [GET]
+ Response 200 (application/json)
    + Attributes (Vote)

### Update Vote [PUT]
+ Response 200 (application/json)
    + Attributes (Vote)

# Group Users

## User [/users/{user_id}]
+ Attributes (object)
    + name: user's Name (string, required)
    + username: user's nickname/username (string, required)
    + _id: user id (string, required)
    + firstname: user's first name
    + created: `2014-11-11T08:40:51.620Z` (string)
    + updated: `2014-11-11T08:40:51.620Z` (string)

+ Parameters
    + user_id (string)
        The ObjectId of the user

### Get User [GET]
+ Response 200 (application/json)
    + Attributes (User)

## Users [GET /users/]
+ Response 200 (application/json)
    + Attributes (array[User])

## Get User by email [GET /users/email/{email}]
+ Parameters
    + email: bob@test.org (string)
        The user email

+ Response 200 (application/json)
    + Attributes (array[User])

## Get User by nickname [GET /users/username/{username}]
+ Parameters
    + username: bob (string)
        The user name

+ Response 200 (application/json)
    + Attributes (array[User])

#Group Profile
## Registration [POST /register]
+ Request (application/json)
    + Attributes
        + email: bob@test.org (string, required)
        + password: blablabla (string, required)
        + username: bob (string, required)

+ Response 200 (application/json)
    + Attributes (LoggedInUser)

## Login [POST /login]
+ Request (application/json)
    + Attributes
        + email: bob@test.org (string, required)
        + password: blablabla (string, required)

+ Response 200 (application/json)
    + Attributes (LoggedInUser)


## Profile [/me/]
+ Response 200 (application/json)
    + Attributes (object)

## Profile orgs [GET /me/orgadmins]
+ Response 200 (application/json)
    + Attributes (array[Org])

## Settings [/me/settings]
+ Attributes (object)
    + language: en (string)

### Get Settings [GET]

+ Response 200 (application/json)
    + Attributes (object)

### Save Settings [PUT]
+ Request (application/json)
    + Attributes (object)

+ Response 200 (application/json)
    + Attributes (object)