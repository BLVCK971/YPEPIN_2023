#!/bin/bash
npm run build
scp -r .next package.json package-lock.json public next.config.js yopi@192.168.1.21:/home/yopi/ypepin.com/
ssh yopi@192.168.1.21 "cd /home/yopi/ypepin.com && npm install --production && sudo systemctl restart ypepin"