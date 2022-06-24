Feature: Background worker

    Scenario: Validate email for new users
        Given a new send validation email job exists
        when we check the database for the email validation job
        then the worker sends a validation to the new user

    @test
    Scenario: Test mock on S3 upload/moto
        Given a file written locally with a date and mock = True
        when we mock s3 and upload the file
        then the mocked uploaded file is not changed 

    @test
    Scenario: Test S3 upload
        Given a file written locally with a date and mock = False
        when we don't mock s3 and upload the file
        then the non mocked uploaded file is changed 
