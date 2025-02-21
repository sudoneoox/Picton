@echo off
REM start_dev.bat (for running from Windows, calls WSL)
REM 1) Launch WSL Ubuntu
REM 2) Change directory
REM 3) Activate environment
REM 4) Keep user in interactive bash shell

wsl -d Ubuntu --cd /mnt/c/Users/yejih/Desktop/COSC4353/Picton --exec bash -ic "micromamba activate picton-backend; cd frontend; pnpm run dev; exec bash"