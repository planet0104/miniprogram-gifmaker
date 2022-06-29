#stop service
systemctl stop gifmaker

cp gifmaker.service /etc/systemd/system

systemctl daemon-reload

#start service
systemctl start gifmaker
# startup
systemctl enable gifmaker

# status
systemctl status gifmaker
