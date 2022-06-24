from loc import _
from loc import l10n

import unittest
from robber import expect

# pylint: disable=no-member

class LocTest(unittest.TestCase):

    def test_loc_set_fr(self):
        l10n.set_language('fr')
        expect(l10n.get_language()).to.be.eq('fr')

    def test_loc_load_en(self):
        l10n.set_language('en')
        l10n.load_domain('email')
        b = _('confirm.text','email', {"link":"http://link"})
        expect(b).to.be.eq("Hello, please confirm your email by opening this link: http://link")


    def test_loc_load_fr(self):
        l10n.set_language('fr')
        l10n.load_domain('email')
        b = _('confirm.text','email', {"link":"http://link"})
        expect(b).to.be.eq("Bonjour, merci de confirmer votre email en cliquant sur ce lien: http://link")