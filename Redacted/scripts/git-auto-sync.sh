#!/bin/bash

# Auto-sync script for Redacted project
# Commits and pushes changes to GitHub if there are any

cd /Users/palsteen/Applications/Vibecoding/Redacted

# Check if there are any changes
if [[ -n $(git status --porcelain) ]]; then
    echo "$(date): Changes detected, syncing to GitHub..."
    
    # Add all changes
    git add .
    
    # Create commit with timestamp
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    git commit -m "Auto-sync: $TIMESTAMP

Changes detected and automatically committed."
    
    # Push to GitHub
    git push origin main
    
    echo "$(date): Sync complete"
else
    echo "$(date): No changes to sync"
fi
