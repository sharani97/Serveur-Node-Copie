Feature: send user various notifs 

   Scenario: idea liked notification
        Given a locked brainstorm mission 
        when the user proposes an idea to the mission 
        and another user likes the idea
        then a notification is sent to warn the user of the like
