import os
import json 
# import i18n

dir_path = os.path.dirname(os.path.realpath(__file__))

# i18n.load_path.append('{}/yamlloc')

strings = {}
domains = []
current_language = 'fr'

def load_domain(domain, language = None):
    global strings, domains

    if language is None:
        language = current_language

    if domain not in domains:
        domains.append(domain)

    if language not in strings:
        strings[language] = {}

    with open('{}/{}.{}.json'.format(dir_path, domain, language), 'r') as json_file:
        strings[language][domain] = json.load(json_file)


def count(nb): #
    if nb == 0:
        return "none"
    if nb == 1:
        return "one"
    if nb > 1:
        return "many"
    return str(nb)


def translate(code, domain, data = {}, lang= None): #

    #
    #if "count" in data:


    if lang is None:
        lang = current_language

    if lang not in strings:
        strings[lang] = {}

    if domain not in strings[lang]:
        load_domain(domain, lang)

    bits = code.split(".")

    val = None

    if len(bits) == 1:
        val = strings[lang][domain][code]
    if len(bits) == 2:
        val = strings[lang][domain][bits[0]][bits[1]]

    ## manage tags, plurals, genders ...


    return val.format(** data).replace("  "," ")

def get_language():
    return current_language

def set_language(lang):
    global current_language
    current_language = lang

    for domain in domains:
        load_domain(domain, lang)


def setup():
    set_language('fr')