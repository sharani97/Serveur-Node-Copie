aws ses send-templated-email --configuration-set-name IDH --source app@idea-heroes.com --destination ToAddresses=david.hockley@gmail.com,hockley@gamificationzone.com --template dev_barebones_en --template-data "{\"body\":\"CLI Test body\", \"title\":\"CLI Test subject\"}" --profile gz