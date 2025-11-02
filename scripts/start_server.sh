#!/bin/bash

###############################################################################
# START SERVER SCRIPT
# Starts the Next.js development server on custom port 3456
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PORT=3456
PID_FILE=".server.pid"
LOG_FILE="logs/server-startup.log"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${GREEN}🚀 Trading Agent - Starting Server${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Change to project directory
cd "$PROJECT_DIR"

# Check if server is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Server is already running (PID: $PID)${NC}"
        echo -e "   Use ./scripts/restart_server.sh to restart"
        echo -e "   Or ./scripts/stop_server.sh to stop"
        exit 1
    else
        echo -e "${YELLOW}⚠️  Stale PID file found, removing...${NC}"
        rm -f "$PID_FILE"
    fi
fi

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ Port $PORT is already in use${NC}"
    echo "   Process using port $PORT:"
    lsof -Pi :$PORT -sTCP:LISTEN
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 node_modules not found, running npm install...${NC}"
    npm install
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
    echo "   Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo -e "${GREEN}✓ Created .env.local from .env.example${NC}"
        echo -e "${YELLOW}   Please update .env.local with your configuration${NC}"
    else
        echo -e "${YELLOW}   No .env.example found, creating minimal .env.local${NC}"
        echo "PORT=$PORT" > .env.local
        echo "NODE_ENV=development" >> .env.local
    fi
fi

# Start the server
echo -e "${GREEN}▶️  Starting Next.js server on port $PORT...${NC}"
echo ""

# Set environment variables and start server in background
PORT=$PORT NODE_ENV=development npm run dev > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# Save PID to file
echo $SERVER_PID > "$PID_FILE"

# Wait a moment for server to start
sleep 2

# Check if process is still running
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server started successfully!${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "  ${GREEN}Local:${NC}            http://localhost:$PORT"
    echo -e "  ${GREEN}Production:${NC}       https://trading-agent.mindweave.tech"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "  ${GREEN}PID:${NC}              $SERVER_PID"
    echo -e "  ${GREEN}Logs:${NC}             tail -f logs/combined-$(date +%Y-%m-%d).log"
    echo -e "  ${GREEN}Startup Log:${NC}      tail -f $LOG_FILE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Commands:"
    echo "  • Stop:     ./scripts/stop_server.sh"
    echo "  • Restart:  ./scripts/restart_server.sh"
    echo "  • Logs:     npm run logs:view"
    echo ""
else
    echo -e "${RED}❌ Server failed to start${NC}"
    echo -e "   Check logs: cat $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi
