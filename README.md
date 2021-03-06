# toni.corteza
Ansible role to setup corteza low code plattform with or without a seperated developement version(s) on subdomain(s). Its developement deployment is capable of debugging with VS Code (go core & node apps). Even if it is possible by now the documentation on debugging is still short right now. To be extended ;)

The roles which are used to install corteza are not made for this purpose only. I m using these roles as a universal base for installing a lot of different applications, normally behind an authenticating reverse proxy (openresty/nginx). By now i havent integrated keycloak in the corteza stack but its on my roadmap.
So some variable may be unexpected but thats ok (at least for me) and maybe will make sense to you after i extend this role.

### Domain / Subdomain

You have to make sure that your domain is pointing to your server. For my tests i use  `toni-media.com` and the subdomain `corteza.toni-media.com`. Write down the IP of your server, y ll need it later. If you are using a Server @ Hetzner **or** Amazon Route 53 DNS** (**to be implemented) you dont have to worry about the setup. This role will take care of creating DNS entries.
For any other dns provider you will have to either adjust the the toni.dns role or y ll need to do the DNS settings manual before running these ansible role, cause SSL-Certificates for the domain and subdomain(s) will be issued automaticly anyway and therefore **all DNS entries of all used subdomains are required.** Set up DNS entries manualy at your dns server / provider if you are not using a server at hetzner **before you run the role.**

## Settings

Edit hosts file and adjust ansible_ssh_host to your server IP:
```bash
nano <inventories>/hosts
```

Edit role variables to fit your need:
```bash
nano <inventories>/group_vars/all.yml
```

```yaml
---
domain: "" # <- Put you domainname here
letsencrypt_email: "" # <- Put your email here
# Mail account which is used not only for keycloak ;)
# Examle gmail / google account needs to be allow insecure auth
keycloak_smtp_password: # <- Put your email password here 
keycloak_smtp_port: "587"
keycloak_smtp_host: "smtp.gmail.com"
keycloak_smtp_from: "jidumailer@gmail.com"
keycloak_smtp_display_name: "Corteza|Toni-Media"
keycloak_smtp_user: "jidumailer@gmail.com"
openresty_session_secret: "623q4hR325t36VsC3Da3H7922IC0073T" #dummy <- replace with vault value
corteza_mysql_user: "corteza"
corteza_mysql_db: "corteza"
corteza_mysql_root_password: "pDsQ2Ahh4W2ojDb4vGeh05n" #dummy, replace with vault value
corteza_mysql_password: "pDsQsg62AW2ojDb4vGeh05nxy" #dummy, replace with vault value
corteza_mysql_image: "percona:8.0"
corteza_image_version: "2021.3.5"

# Developement only
host_ssh_port: 2224 # Access docker container by SSH 
corteza_dev_enable: "false"
corteza_dev_base_url: "dev.toni-media.com"
corteza_dev_repository: "https://github.com/tnissen375/corteza-server.git"
corteza_dev_version: "2021.3.x"
corteza_app_enable: "false"
corteza_app_repository: "https://github.com/tnissen375/corteza-webapp-compose.git"
corteza_app_version: "2021.3.x"

# only for use with hetzner DNS / autocreate DNS records for subdomains
dns_create: false 
dns_update: false 
api_token: # only necessary if not set by toni.dns role
```

## Installation

On the first run this role will build some "basic" docker images on the installer machine - no docker registry is needed. This has to be done only once (or when a new image version is needed) and takes several minutes due to creation of these images especially because of openresty/dhparam.

The images are stored at your installer machine, p.e. WSL2 and transfered to target machines if needed. If you ever need to tigger or rebuild the images: 
`ansible-playbook builder.yml -i <inventories> --vault-id corteza@vault`

Normally install the ansible requirements and you are good to go. 
`ansible-galaxy install -r requirements.yml`

If you have any doubts check the requirements-section at the end.

### Basic setup (run once)
```bash
ansible-playbook ./install.yml -i <inventories> --vault-id corteza@vault --tags "build, host"
```

### Production
Deploy complete production
```bash
ansible-playbook install.yml -i <inventories> --vault-id corteza@vault --tags "corteza" --skip-tags "dev,app" --extra-vars "ansible_ssh_host=89.58.8.242"
```

### Development corteza core
Deploy developement branch, deploy_name corresponds to the subdomain where the app is deployed (make sure you set DNS records at your DNS-server). Specify extra-vars for repository if needed. Set extra var `corteza_webapp_enable=false` if you want to debug corteza apps.

```bash
ansible-playbook ./install.yml -i <inventories> --vault-id corteza@vault --tags "corteza, dev" --skip-tags "app" --extra-vars "deploy_name=dev corteza_webapp_enable=true corteza_dev_enable=true"
```

### Development corteza apps 

You can deploy production and as many developement branches as desired (limited by server ressources) in parallel.
Make sure you have created dns records for the subdomains.
If you are using hetzner server this can be done automaticly, you have to specify your api tokens in inventory from toni.corteza or in toni.dns role:
Change the <inventories> path in the examples accordingly to your ansible installation.

Example with token from toni.dns role:
```bash
ansible-playbook ./install.yml -i <inventories> --vault-id dns@vault --vault-password-file ../toni.dns/vault --vault-id corteza@vault --tags "corteza, app" --skip-tags "dev" --extra-vars "deploy_name=one
corteza_app_repository=https://github.com/cortezaproject/corteza-webapp-one.git corteza_app_version=2021.9.x host_ssh_port=2226 nginx_stack_keep_alive=true dns_create=true corteza_app_enable=true"
```

Example with already (manual) setup dns records (apps: compose, admin and one), chosse different `host_ssh_port` for each app.
```bash
ansible-playbook ./install.yml -i <inventories> --vault-id corteza@vault --tags "corteza, app" --skip-tags "dev" --extra-vars "deploy_name=compose corteza_app_repository=https://github.com/cortezaproject/corteza-webapp-compose.git corteza_app_version=2021.9.x host_ssh_port=2224 nginx_stack_keep_alive=true corteza_app_enable=true"

ansible-playbook ./install.yml -i <inventories> --vault-id corteza@vault --tags "corteza, app" --skip-tags "dev" --extra-vars "deploy_name=admin corteza_app_repository=https://github.com/cortezaproject/corteza-webapp-admin.git corteza_app_version=2021.9.x host_ssh_port=2225 nginx_stack_keep_alive=true corteza_app_enable=true"

ansible-playbook ./install.yml -i <inventories> --vault-id corteza@vault --tags "corteza, app" --skip-tags "dev" --extra-vars "deploy_name=workflow
corteza_app_repository=https://github.com/cortezaproject/corteza-webapp-workflow.git corteza_app_version=2021.9.x host_ssh_port=2227 nginx_stack_keep_alive=true corteza_app_enable=true"
```

You can deploy production and as many developement branches as desired (limited by server ressources) in parallel.
Hopefully all went well and your corteza server and subdomains are ready.
- Production: `corteza.<your domain>.com`, p.e. `corteza.toni-media.com`.
- Development corteza core: `dev.<your domain>.com`, p.e. `dev.toni-media.com`.
- Development corteza app: `compose.<your domain>.com`, p.e. `compose.toni-media.com`. 

Feel free to contact me if any problems arise. ;)

## Commands for easy access

Enter the desired stack installtion dir in user path. (p.e. `/root/dev`) and execute commands to your swarm node stack.

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
This ansible role is tested to work with ubuntu 20 so i would advice not to use any version below. There may be issues. You dont have to use WSL. You can use any ubuntu 20 cloud server too. I would recommend 4GB memory.

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
nano vault
```

You will have to add a random string to the vault file if you want to use vault as i do in my examples. (STRG+X to end nano)  [More information on vault.](https://docs.ansible.com/ansible/latest/user_guide/vault.html)
Off course you can add all values in clear if you dont want to push your changes to your private git or if you dont care about security. Your decision ;)


```bash
nano <inventories>/group_vars/all.yml
```

The roles which are used to install corteza are not made for this purpose only. I m usin these roles as a universal base for installing a lot of different applications, normally behind an authenticating reverse proxy (openresty/nginx). By now i havent integrated keycloak in the corteza stack but its on my roadmap.
So some variable may be unexpected but thats ok (at least for me) and maybe will make sense to you after i extend this role.

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
```

Wanna have a look at the just stored values?
Sure. Thats possible if you have the correct vault pass.

```bash
ansible localhost -m debug -a var="keycloak_smtp_password" -i <inventories> --vault-id corteza@vault
```

## Debug with VS Code

The whole installation is done on a single node swarm. By now the source code is checked out to and the host mounted to the docker dev container(s). You can install as many parallel versions as you like. (limited by server ressources). The versions are seperated and no ressources are shared, except service for generating PDFs.
All containers are connected to the same network. The developement containers are accessable by SSH (only by private key). Install your public SSH-Key to the host and you will be able to access the development container as well. (Port 2223,...)

### Core / Go
[VS Code debugging go](https://github.com/golang/vscode-go/blob/master/docs/debugging.md)

If you havent switched the ssh port of the dev container you can connect to the dev container on port 2223 of your docker host. After connecting with your standard host ssh key you should install the go extension from within vs code. This will be installed remotly to the container. 

After doin so you can connect to your host and go to your dev folder:

```bash
cd ~/cortezadev
make debug
```

Delve will be started in headless mode. If all went well you can start debugging in vs code, cause the vs code debug config has been deployed through the ansible role already. Debugging setup is not ideal by now, after changing go files in the container its necessary to restart the stack cause the new binary will be build automaticly and the pid is changing and delve is not connected anymore. This can be reolved if i figure out how i can get vs code to respect server/user paths. 
Until than:

```bash
cd ~/cortezadev
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
- Add Route53 DNS
- Add deployment for AWS
- Automatic tests

Any other ideas? Drop me a line.