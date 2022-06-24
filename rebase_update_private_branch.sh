#!/bin/bash

stash() {
  # check if we have uncommited changes to stash
  git status --porcelain | grep "^." >/dev/null;

  if [ $? -eq 0 ]
  then
    if git stash save -u "git-update on `date`";
    then
      stash=1;
    fi
  fi
}

unstash() {
  # check if we have uncommited change to restore from the stash
  if [ $stash -eq 1 ]
  then
    git stash pop;
  fi
}

stash=0;

stash;

branch=`git branch | grep "\*" | cut -d " " -f 2-9`;

if [ "$branch" == "master" ]
then
  git pull origin master;
else

  git checkout master;
  git pull origin master;
  git checkout "$branch";
  git rebase master;

fi

unstash;