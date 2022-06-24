Feature: Loc engine

    Scenario: Translate an loc key 
        Given the language was set
        when we ask for a loc key 
        then the loc engine gives it to us 
