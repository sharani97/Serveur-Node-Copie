from behave import *
from loc import _
from loc import l10n
from robber import expect

@given('the language was set')
def step_impl(context):
    context.lang = 'fr'

@when('we ask for a loc key')
def step_impl(context):
    b = _('confirm.text','email', {'link':'http://test'}, context.lang)
    context.loc_result = b 

@then('the loc engine gives it to us')
def step_impl(context):
    expect(context.loc_result).to.be.eq("Bonjour, merci de confirmer votre email en cliquant sur ce lien: http://test")
