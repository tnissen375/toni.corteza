# toni.corteza
Update to work with 2023.3.0-dev.1 (This role is not backwards compatible: works with 2022.9.4 and above)

Ansible role to setup corteza low code plattform behind keycloak and openresty authenticating proxy. (all SSL certs created)
Dev setup available, set up on seperated subdomains.
The developement deployment is capable of debugging with VS Code (go core & node apps). Even if it is possible the documentation on debugging is still short right now. To be extended ;)

The roles which are used to install corteza are not made for this purpose only. I m using these roles as a universal base for installing a lot of different applications, normally behind an authenticating reverse proxy (openresty/nginx). This ansible role is capable of installing keycloak, creating keycloak configs and activate Oauth in Corteza (or dev).
Some variable may be unexpected but thats ok (for me) and maybe not all vars beside described standard conf work for you.

### Domain / Subdomain

You have to make sure that your domain can be resolved by DNS. For my tests i use `toni-media.com` and the subdomain `corteza.toni-media.com`. Write down the IP of your server, y ll need it later.
SSL-Certificates for the domain and all needed subdomain(s) will be issued automaticly. (therefore **all DNS entries of all used subdomains are required.**)
Set up DNS entries for all used domains / subdomains manualy at your dns server. If you wanna develope with this stack, create at least the following subdomains: (corteza, dev, admin, compose, workflow, reporter, discovery, privacy). Dont use other names for subdomains, cause these names are still hardcoded in some files, so it wont work out of the box.

**These steps are described assuming your are root user on the ansible controller machine and that this machine has acccess to the vhost/dedicated server on which you wanna install corteza.**

## Settings
In this manual i expect y r using [toni.inventorie](https://github.com/tnissen375/toni.inventorie), you can use your own or adjust it to your needs. Make sure y r root on installer machine and the ssh key from the installer machine is added to the authorized keys on the target (corteza) server. 

Edit role variables to fit your need:
```bash
nano /root/toni.inventorie/server/group_vars/targets.yml
```

```yaml
---
domain: "" #<-- adjust
letsencrypt_email: "" #<-- adjust
# Mail account which is used not only for keycloak ;)
# gmail / google account needs to be allow insecure auth
keycloak_smtp_password: # <- Put your email password here 
keycloak_smtp_port: "587"
keycloak_smtp_host: "smtp.gmail.com"
keycloak_smtp_from: "<name>@gmail.com" #<-- adjust
keycloak_smtp_display_name: "Corteza|<name>" #<-- adjust
keycloak_smtp_user: "<name>@gmail.com" #<-- adjust
openresty_session_secret: "623q4hR325t36VsC3Da3H7922IC0073T" #dummy <- to be replaced with vault value
corteza_mysql_user: "corteza"
corteza_mysql_db: "corteza"
corteza_mysql_root_password: "pDsQ2Ahh4W2ojDb4vGeh05n" #dummy, to be replaced with vault value
corteza_mysql_password: "pDsQsg62AW2ojDb4vGeh05nxy" #dummy, to be replaced with vault value
corteza_mysql_image: "percona:8.0"
corteza_image_version: "2023.3.0-dev.1"
...
```
Create vault file and change the vault secrets. See detailed instructions further down.

## Installation

I have droped the Infos on the role for building docker images in this role (for simplicity). The images used will be installed from dockerhub. If you need any Infos on building them with ansible drop me a line.

Install the ansible requirements and you are good to go. 
`ansible-galaxy install -r requirements.yml`

If you have any doubts or need to install ansible first, check the requirements-section at the end.

### Production
Deploy production setup. All commands run from within toni.corteza role dir if not stated otherwise.

First we prepare the corteza host. Install packages, docker and the openresty proxy
```bash
ansible-playbook host.yml -i ../toni.inventorie/server --vault-id corteza@vault --tags "host" --extra-vars "ansible_ssh_host=<YOUR SERVER IP HERE>"
```

After installing the basics we are ready to install keycloak/corteza stack
```bash
ansible-playbook install.yml -i ../toni.inventorie/server --vault-id corteza@vault --tags "keycloak, kc_realm" --skip-tags "kc_role" --extra-vars "ansible_ssh_host=<YOUR SERVER IP HERE>"

ansible-playbook install.yml -i ../toni.inventorie/server --vault-id corteza@vault --tags "corteza" --skip-tags "dev" --extra-vars "ansible_ssh_host=<YOUR SERVER IP HERE> keycloak_client_name=Corteza create_kc_role=true, create_kc_client=true, create_kc_user=true"
```

### Dev setup (core and apps)
The core corteza server is deployed at dev. All apps are deployed to their subdomains mentioned above. If you do not want to dev any app, you could add the extra var `corteza_webapp_enable=true` on the install prompt, so that the apps are run from core dev container. (the deploy_name has to be dev - dont change!! Subdomain names are fixed atm, dont change)

Fork the corteza server from [Github Corteza](https://github.com/cortezaproject/corteza.git) and change IP and Guthub User in the command below.

```bash
ansible-playbook ./install.yml -i ../toni.inventorie/server --vault-id corteza@vault --tags "corteza, dev" --extra-vars "ansible_ssh_host=<YOUR SERVER IP HERE> keycloak_client_name=Corteza deploy_name=dev corteza_dev_enable=true corteza_webapp_enable=false corteza_dev_repository=https://github.com/<GITHUB USER>/corteza.git"
```

### Development corteza apps 

You can connect VS Code to main corteza dev branch at port 2223, the apps can be reached:
```bash
admin. @port: 2400
one.  @port: 2401
compose. @port: 2402
discovery. @port: 2403
privacy. @port: 2404
reporter. @port: 2405
workflow. @port: 2406
```
To make this work you only have to install an SSH key to access the host. This key will be used by all created dev container. So you dont have to worry about how to access the containers. Connect from VS Code with your host SSH key @ the mentioned Port above.

Hopefully all went well and your corteza server and subdomains are ready.
- Production: `corteza.<your domain>.com`, p.e. `corteza.toni-media.com`.
- Development corteza core: `dev.<your domain>.com`, p.e. `dev.toni-media.com`.
- Development corteza app: `one.<your domain>.com`, p.e. `one.toni-media.com`. 

Feel free to contact me if any problems arise. ;)

## Commands for easy access

Enter the desired stack installation dir in user path. (p.e. `/root/dev`) and execute commands to your swarm node stack. Have a look at the Makefile to get a list of all avail. commands.

#### Backup

The backup is stored in `{{ user path }}/backup`, p.e. `root/dev/backup`

```bash
# Take a backup of data dir
make bckup

# Take a backup of the database
make bckupdb
```

#### Restore
```bash
# Restore data dir
make restore file=backup/data_2021_06_01.tar.gz
# Restore database
make restoredb file=backup/dev_db_2021_06_01.sql.gz
```

#### Start stack

```bash
make deploy
```

#### Stop stack

```bash
make rm
```

#### show logs

```bash
#show log app container
make log
#show log db container
make logdb
```

#### exec container

```bash
#enter app container
make exec
#enter db container
make execdb
```

## Requirements - prepare before installation 

**Skip this section if you already familiar with ansible and vault.** 

#### Setup server with ansible and vault

In this example i use my windows machine with the linux subsystem as `ansible installer machine` which is responsible for deploy all online servers. 
This ansible role is tested to work with ubuntu 20 (root user) so i would advice not to use any version below. There may be issues. You dont have to use WSL. You can use any ubuntu 20 cloud server too. I would recommend 4GB memory.

```bash
apt update
apt upgrade
apt install git python3-pip
pip3 install ansible
ansible-galaxy collection install ansible.netcommon
```

### Setup a target machine with Ubuntu 20.

**This is the machine where corteza will be deployed.** 

Make sure the ssh key from the installer machine is added to the authorized keys on the target machine. 

### Back on installer machine

```bash
cd ~
git clone https://github.com/tnissen375/toni.corteza.git
cd toni.corteza
ansible-galaxy install -r requirements.yml
tr -dc A-Za-z0-9 </dev/urandom | head -c 64 > vault
```

You can change that random string in the vault file or skip the step complete and add all values in clear to your conf files, but for security reasons you should never do that. Your decision ;)
[More information on vault.](https://docs.ansible.com/ansible/latest/user_guide/vault.html)
Backup the vault key, you ll need it whenever you want to reinstall or decrypt any of the secrets. Keep it in a safe place.

The roles used to install corteza are not made for this purpose only. I m usin these roles as a universal base for installing a lot of different applications, normally behind an authenticating reverse proxy (openresty/nginx). Keycloak is smoothly integrates whith corteza in this setup stack, but corteza can be used / installed whithout if preffered.
There may be vars in the conf files that did not do anything. Ignore. ;)

Adjust the conf to your needs: 
```bash
nano <inventorie role dir>/server/group_vars/targets.yml
```

```yaml
---
domain: "" # <- Put you domainname her
letsencrypt_email: "" #<- Put your email here, if not gmail some other settings have to be changed also

keycloak_smtp_password: !vault |
          $ANSIBLE_VAULT;1.2;AES256;corteza
          39366630653937326330633461353733363431633739656136623261393361306436313466626230
          3964653236316665313536366461616138346666376233380a653862666230643763623131393261
          32333364366666373735316339303030396536346336316134623865323230333933376435353665
          6533643331616433660a663465626335353263306365626437653830386635306161653664386665
          39343562636135366233313164306234386233346563343164383035303631663834

openresty_session_secret: !vault |
          $ANSIBLE_VAULT;1.2;AES256;corteza
          36343036653562363036633237663535333263653665326466306663353530663765303033316436
          3932316461646463393064323563336331353339616161640a333236376664663261333439653734
          65616536396161613438626163393337656334353839393038373736653261333066666232653165
          3863383263393734340a343262333464666239326562383733323939386631626336613062373130
          30616364663136303933626337623839643835636430313934343331616330306133

corteza_mysql_root_password: !vault |
          $ANSIBLE_VAULT;1.2;AES256;corteza
          35626362333135383431643336366236653932396431353130616162306430323037343232636236
          6637616462663561346165373439306633383939333261640a633331356266376238643336303233
          63313136643436306663643961313762636663303661316263323734356137663434326363353038
          3434343336643537330a653636626561343636383835646332303265313534616265653531373663
          33363037326266333662383363646566633264313131303266343065313636376339

corteza_mysql_password: !vault |
          $ANSIBLE_VAULT;1.2;AES256;corteza
          32623464383661373236383364323964306536633533653930653166343662303161663631323839
          3962663766396362396361636335313662613262353839380a623036633865356436653264653362
          35343233333731343632343738653831353334303231316637653365643931346364353434653837
          3539353238376334650a303161336463306431333838336536633661353461613436353835326161
          30623236626638303636353566323537396265336436393133333332383232366230
```

You have to create some values and change them in the configuration above.

```bash
ansible-vault encrypt_string --stdin-name 'openresty_session_secret' --vault-id corteza@vault

ansible-vault encrypt_string --stdin-name 'corteza_mysql_root_password' --vault-id corteza@vault

ansible-vault encrypt_string --stdin-name 'corteza_mysql_password' --vault-id corteza@vault

ansible-vault encrypt_string --stdin-name 'keycloak_smtp_password' --vault-id corteza@vault

aso...
```
Wanna have a look at the just stored values?
Sure. Thats possible if you have the correct vault pass.

```bash
ansible localhost -m debug -a var="keycloak_smtp_password" -i <inventories> --vault-id corteza@vault
```

## Debug with VS Code

The whole installation is done on a "single node" swarm. 
All containers are connected to the corteza and/or the nginx network. The developement containers are accessable by SSH by (host) private key. Install your public SSH-Key to the host and you will be able to access the development container as well. (Port 2223,...)

### Core / Go
[VS Code debugging go](https://github.com/golang/vscode-go/blob/master/docs/debugging.md)

If you havent switched the ssh port of the dev container you can connect to the dev container on port 2223 of your docker host. After connecting with your standard host ssh key you should install the go extension from within vs code. This will be installed remotly to the container. 

After doin so you can connect to your host and go to your dev folder:

```bash
cd ~/dev
make debug
```

Delve will be started in headless mode. If all went well you can start debugging in vs code, cause the vs code debug config has been deployed through the ansible role already. Debugging setup is not ideal by now, after changing go files in the container its necessary to restart the stack cause the new binary will be build automaticly and the pid is changing and delve is not connected anymore. This can be reolved if i figure out how i can get vs code to respect server/user paths. 
Until than:

```bash
cd ~/dev
make rm
make deploy
make debug
```

### Apps / Node
[VS Code attaching to node](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_attaching-to-nodejs)
https://devtools.vuejs.org/guide/installation.html

*todo*: add guide ;)

## Whats up next?
- Extend documentation
- ~~Guide on go debugging~~
- Guide on node debugging
- Guide on app creation 
- Add postfix container
- ~~Automate sink route~~
- Automatic tests

Any other ideas? Drop me a line.