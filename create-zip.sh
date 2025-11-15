#!/bin/bash
zip -r project.zip . -x "*.git*" "node_modules/*" ".encore/*" "*.zip"
