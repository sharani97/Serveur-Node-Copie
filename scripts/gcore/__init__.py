
plurals = {
    "entity":"entities"
}

def pluralize(resource):

    if resource in plurals:
        return plurals[resource]
    if resource[-1:] == 's':
        return resource
        
    return '{}s'.format(resource)