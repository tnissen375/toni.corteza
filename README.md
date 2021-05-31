# toni.corteza
Ansible role to setup corteza low code plattform with or without a seperated developement version. (Port 8443).

### How to install

In this example i use my windows machine with the linux subsystem. This ansible role is tested to work with ubuntu 20 so i would advice not to use any version below. There may be issues. You dont have to you WSL. You can use any ubuntu 20 server too.

```bash
apt update
apt upgrade
apt install git python3-pip
pip3 install ansible
ansible-galaxy collection install ansible.netcommon
```

Setup a target machine, also with Ubuntu 20. **This is the machine where corteza will be deployed.** 
Make sure the ssh key from the installer machine is added to the authorized keys on the target machine. 

### Domain / Subdomain

You have to make sure that your domain is pointing to your server. For my tests i use  `toni-media.com` and the subdomain `corteza.toni-media.com`. Write down the IP of your server, y ll need it later.
These settings have to be done before running these ansible role, cause SSL-Certificates for the subdomain will be issued automaticly.

### Back on installer machine

```bash
cd ~
git clone https://github.com/tnissen375/toni.corteza.git
cd toni.corteza
ansible-galaxy install -r requirements.yml
nano vault
```

You will have to add a random string to the vault file. (STRG+X to end nano)  [More information on vault.](https://docs.ansible.com/ansible/latest/user_guide/vault.html)

```bash
nano inventories/group_vars/all.yml
```

The roles which are used to install corteza are not made for this purpose only. I m usin these roles as a universal base for installing a lot of diffrent applications, normally behind an authenticating reverse proxy (openresty/nginx). By now i havent integrated keycloak in the corteza stack but its on my roadmap.
So some variable may be unexpected but thats ok and maybe will make sense to you after i extend this role.

```yaml
---
domain: "" # <- Put you domainname her
lets_encrypt_mail: "" #<- Put your email here, if not gmail some other settings have to be changed also

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
ansible localhost -m debug -a var="keycloak_smtp_password" -i inventories --vault-id corteza@vault
```

You have to cahnge the ip, so that your server ip is used:

```bash
nano inventories/hosts
```

So, you are good to go now.

Deploy production
```bash
ansible-playbook ./install.yml -i inventories --vault-id corteza@vault
```
Deploy developement branch, substitue <subdomain_dev_branch> with subdomain name (make sure you set DNS records). 
```bash
ansible-playbook ./install.yml -i inventories --vault-id corteza@vault --tags "untagged,dev" --extra-vars "nginx_subdomain=<subdomain_dev_branch>. corteza_dev_enable=true deploy_name=cortezadev"
```

Hopefully all went well and your corteza server is ready.
 `corteza.<your domain>.com`, p.e. `corteza.toni-media.com`.