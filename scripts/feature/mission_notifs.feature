Feature: send user mission notifs & emails 

   Scenario: Mission start notification
        Given a brainstorm mission created by an orgadmin
        when the orgadmin locks the mission 
        then a notification is sent to warn the user of the locked mission 
        and an email is sent to warn the user of the locked mission 

   Scenario: Mid Mission notification
        Given a brainstorm mission created by an orgadmin
        when the mission is halfway through  
        then a notification is sent to get the user to take part 
        and an email is sent to warn the user to get him to take part 

    Scenario: Mission end notification
        Given a brainstorm mission created by an orgadmin
        when the mission comes to an end
        then a notification is sent to warn the user of the end of the mission 
        and an email is sent to warn the user tell him of what he has won
        