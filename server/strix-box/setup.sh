#!/bin/bash
# BauGenius Strix Box Setup Script
# Installs Ollama, pulls Qwen 2.5 72B, and sets up Night Jobs

echo "🚀 Starting BauGenius Strix Box Setup..."

# 1. Update & Dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nodejs npm build-essential

# 2. Install Ollama
if ! command -v ollama &> /dev/null; then
    echo "📦 Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "✅ Ollama already installed."
fi

# 3. Pull Model
echo "🧠 Pulling Qwen 2.5 72B (this will take a while, ~41GB)..."
# Using Q4_K_M quantization for 128GB RAM safety
ollama pull qwen2.5:72b

# 4. Configure Ollama for LAN access
echo "🔧 Configuring Ollama for external access..."
sudo mkdir -p /etc/systemd/system/ollama.service.d
echo "[Service]
Environment=\"OLLAMA_HOST=0.0.0.0\"" | sudo tee /etc/systemd/system/ollama.service.d/override.conf

sudo systemctl daemon-reload
sudo systemctl restart ollama

# 5. Set up Night Jobs
echo "📂 Setting up Night Jobs..."
cd /home/$USER/baugenius/server/strix-box
npm install @supabase/supabase-js axios dotenv

# 6. Set up Crontab
echo "⏰ Configuring Cron Jobs..."
(crontab -l 2>/dev/null; echo "0 6 * * * node /home/$USER/baugenius/server/strix-box/night-jobs.js reconcile") | crontab -
(crontab -l 2>/dev/null; echo "15 6 * * * node /home/$USER/baugenius/server/strix-box/night-jobs.js overdue") | crontab -
(crontab -l 2>/dev/null; echo "30 6 * * * node /home/$USER/baugenius/server/strix-box/night-jobs.js material") | crontab -
(crontab -l 2>/dev/null; echo "0 7 * * * node /home/$USER/baugenius/server/strix-box/night-jobs.js report") | crontab -

echo "✅ Setup Complete!"
echo "Please edit /home/$USER/baugenius/server/strix-box/.env with your credentials."
