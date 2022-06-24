Feature: test the tests

    @test
    Scenario: Run a test
        Given a behave installation
        when we implement a test
        then the test is executed

    @test
    Scenario: Test mocking
        Given an API call
        when we mock the call 
        then it answers something else 