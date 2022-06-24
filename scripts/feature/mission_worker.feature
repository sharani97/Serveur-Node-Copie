Feature: Mission worker


   Scenario: Before end of mission
        Given a brainstorm mission created by an orgadmin
        and a worker set up to check the end of the mission
        when the worker checks the end  
        then the worker sets itself to the new date

    Scenario: End of mission phase
        Given a brainstorm mission created by an orgadmin
        when a mission phase comes to an end 
        then the mission worker sends an email to the orgadmin to warn him 
        and the mission phase is set to finished

    Scenario: Reward non orgadmin users on end of mission investment phase
        Given a mission with an investment phase
        and a user who has made a good investment 
        when the investment phase comes to an end 
        then the user is rewarded based on his performance 