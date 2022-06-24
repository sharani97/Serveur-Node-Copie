#!/bin/bash

if [ -z "$SSH_AUTH_SOCK" ] ; then
  eval `ssh-agent -s`
  ssh-add ~/.ssh/ec2
fi

git checkout -f ./scripts
git checkout -f ./server/src
# coucou
git checkout hs-srv

git pull # origin master # develop
yarn install

# git submodule update
# cd ./react
#git checkout master
#git pull
#yarn install
#cd ..

yarn build

#node build-client.js

#mv ./react/build/ ./dist/client/

yarn stop

yarn start
