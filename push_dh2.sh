
branch=`git branch | grep "\*" | cut -d " " -f 2-9`;

if [ "$branch" == "master" ]
then
  #git pull origin master;
  echo 'do nothing'
else
 git push origin g11zone-srv:g11zone-srv
end 
