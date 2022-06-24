import glob
import os

old = ["Milestone","Line","Product","SalesAction","Rights", "Season", "Content", "VideoContent","Company","Contract", "Contact", "Language","Country","Hero"]


sets =  [
    {'path': 'app/business', 'class':'Business'},
    {'path': 'app/business/interfaces', 'class': 'Business'},

    {'path': 'app/repository', 'class': 'Repository'},
    {'path': 'app/model', 'class': 'Model'},
    {'path': 'app/model/interfaces', 'class': 'Model'},
    {'path': 'app/dataAccess/schemas', 'class': 'Schema'},
    {'path': 'controllers', 'class': 'Controller'},
    {'path': 'config/routes', 'class': 'Routes'},
]



def checkPathSet(set):

    print(set['path'])

    start = '../server/src/{}'.format(set['path'])
    #print(start)

    files = glob.glob('{}/*.ts'.format(start))

    #print(files)

    shortFiles = []

    for f in files:
        name = f[len(start)+1:-3]
        # print(name)
        shortFiles.append(name)

    for o in old:
        nf = '{}{}'.format(o,set['class'])
        full = '{}/{}.ts'.format(start, nf)
        if nf in shortFiles:

            print('{} found (del) - {}'.format(nf, full))
            os.remove(full)
        #else:
        #    print('{} NOT found - {}'.format(nf, full))


    #    for o in old:
    #        # print(o, name, name[:len(o)])
    #        if name[:len(o)] == o:
    #            print('removing ',path, name)
    #            #os.remove('{}/{}'.format(start,name))


for set in sets:
    checkPathSet(set)