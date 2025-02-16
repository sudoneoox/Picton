#!/bin/bash
# Initialize micromamba shell integration for bash
eval "$(micromamba shell hook --shell bash)"

# Activate the picton-backend environment
micromamba activate picton-backend

# Navigate to the project directory
cd /mnt/c/Users/yejih/Desktop/COSC4353/Picton

echo "Micromamba environment activated. You're now ready to run Django or pnpm commands."
exec bash