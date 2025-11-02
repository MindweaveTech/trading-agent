#!/bin/bash

###############################################################################
# STOP SERVER SCRIPT
# Gracefully stops the Next.js development server
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PID_FILE=".server.pid"
PORT=3456
TIMEOUT=10
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${RED}🛑 Trading Agent - Stopping Server${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Change to project directory
cd "$PROJECT_DIR"

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}⚠️  No PID file found${NC}"

    # Check if anything is running on the port anyway
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}   But port $PORT is in use, attempting to stop...${NC}"
        PID=$(lsof -t -i:$PORT)
        echo -e "   Found process: $PID"
    else
        echo -e "${GREEN}   Server is not running${NC}"
        exit 0
    fi
else
    PID=$(cat "$PID_FILE")
    echo -e "   Found PID: $PID"
fi

# Check if process is running
if ! ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Process $PID is not running${NC}"
    rm -f "$PID_FILE"

    # Check if anything else is using the port
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        NEW_PID=$(lsof -t -i:$PORT)
        echo -e "${YELLOW}   But another process ($NEW_PID) is using port $PORT${NC}"
        echo -e "   Attempting to stop it..."
        PID=$NEW_PID
    else
        echo -e "${GREEN}   Server is not running${NC}"
        exit 0
    fi
fi

# Try graceful shutdown with SIGTERM
echo -e "${YELLOW}⏳ Sending SIGTERM (graceful shutdown)...${NC}"
kill -TERM "$PID" 2>/dev/null || true

# Wait for process to terminate
COUNTER=0
while ps -p "$PID" > /dev/null 2>&1; do
    if [ $COUNTER -ge $TIMEOUT ]; then
        echo -e "${RED}⚠️  Process did not stop gracefully${NC}"
        echo -e "${YELLOW}   Forcing shutdown with SIGKILL...${NC}"
        kill -9 "$PID" 2>/dev/null || true
        sleep 1
        break
    fi

    sleep 1
    COUNTER=$((COUNTER + 1))
    echo -n "."
done

echo ""

# Verify process is stopped
if ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${RED}❌ Failed to stop server${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Server stopped successfully${NC}"
fi

# Clean up PID file
if [ -f "$PID_FILE" ]; then
    rm -f "$PID_FILE"
    echo -e "${GREEN}✓ Cleaned up PID file${NC}"
fi

# Verify port is freed
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port $PORT is still in use by another process:${NC}"
    lsof -Pi :$PORT -sTCP:LISTEN
else
    echo -e "${GREEN}✓ Port $PORT is now free${NC}"
fi

echo ""
echo -e "${GREEN}All done!${NC}"
