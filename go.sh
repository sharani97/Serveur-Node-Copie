git checkout g11zone-srv
git merge g11zone-srv-dev -m "merge from branch develop"
./push_dh.sh 
git push
git checkout g11zone-srv-dev
./push_dh.sh
git push
cd ../ansible
./update.sh
cd ../gamecore-srv
