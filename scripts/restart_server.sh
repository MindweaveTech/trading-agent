#!/bin/bash

###############################################################################
# RESTART SERVER SCRIPT
# Stops the current server and starts a new instance
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🔄 Trading Agent - Restarting Server${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Change to project directory
cd "$PROJECT_DIR"

# Stop the server
echo -e "${YELLOW}1/2 Stopping current server...${NC}"
if ./scripts/stop_server.sh; then
    echo -e "${GREEN}✓ Server stopped${NC}"
else
    echo -e "${YELLOW}⚠️  No server was running${NC}"
fi

echo ""

# Wait a moment for port to be freed
echo -e "${YELLOW}⏳ Waiting for port to be freed...${NC}"
sleep 2

# Start the server
echo -e "${YELLOW}2/2 Starting new server instance...${NC}"
./scripts/start_server.sh

echo ""
echo -e "${GREEN}✓ Server restarted successfully!${NC}"
