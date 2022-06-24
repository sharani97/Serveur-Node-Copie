import requests 
from behave import *
from unittest import mock

@given('a behave installation')
def step_impl(context):
    print("failed in installed:",context.failed)
    pass

@when('we implement a test')
def step_impl(context):
    print("failed:",context.failed)
    print(True is not False)
    assert True is not False

@then('the test is executed')
def step_impl(context):
    print(context.failed)
    assert context.failed is False

# https://jsonplaceholder.typicode.com/todos/1
#{
#  "userId": 1,
#  "id": 1,
#  "title": "delectus aut autem",
#  "completed": false
#}
#Given an API call
#when we mock the call 
#then it answers something else 


# This method will be used by the mock to replace requests.get
def mocked_requests_get(*args, **kwargs):
    class MockResponse:
        def __init__(self, json_data, status_code):
            self.json_data = json_data
            self.status_code = status_code

        def json(self):
            return self.json_data

    return MockResponse({"key1": "value1", "title":"no"}, 200)


@given('an API call')
def step_impl(context):
    context.apiurl = "https://jsonplaceholder.typicode.com/todos/1"


@when('we mock the call')
def step_impl(context):
    with mock.patch('requests.get') as mocked_requests_get:
        context.response = requests.get(context.apiurl).json()
        print('response', context.response)

@then('it answers something else')
def step_impl(context): 
    assert context.response["title"] != "delectus aut autem"