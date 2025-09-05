#!/bin/bash

# Keep Alive Script for Render Deployment
# Pings the Render app every 5 minutes to prevent it from going to sleep

# Configuration
RENDER_URL=${RENDER_URL:-"https://astro-luxe-guide.onrender.com"}
HEALTH_ENDPOINT="/health"
PING_INTERVAL=300  # 5 minutes in seconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BRIGHT='\033[1m'
NC='\033[0m' # No Color

# Logging function
log() {
    local message="$1"
    local color="${2:-$NC}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${color}[${timestamp}] ${message}${NC}"
}

# Ping function
ping_server() {
    local url="${RENDER_URL}${HEALTH_ENDPOINT}"
    log "🔄 Pinging ${url}..." "$CYAN"
    
    # Use curl with timeout
    local response=$(curl -s -w "\n%{http_code}" --max-time 30 "$url" 2>/dev/null)
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        log "✅ Ping successful! Status: $http_code" "$GREEN"
        if [ -n "$body" ]; then
            log "📊 Response: ${body:0:100}$([ ${#body} -gt 100 ] && echo '...')" "$BLUE"
        fi
    else
        log "⚠️ Ping returned status: $http_code" "$YELLOW"
        if [ -n "$body" ]; then
            log "📄 Response: ${body:0:200}$([ ${#body} -gt 200 ] && echo '...')" "$YELLOW"
        fi
    fi
}

# Signal handler for graceful shutdown
cleanup() {
    log "🛑 Shutting down Keep-Alive service..." "$YELLOW"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main function
main() {
    log "🚀 Starting Keep-Alive service for $RENDER_URL" "$BRIGHT"
    log "⏰ Ping interval: $PING_INTERVAL seconds" "$BRIGHT"
    log "🎯 Health endpoint: $HEALTH_ENDPOINT" "$BRIGHT"
    log "📝 Press Ctrl+C to stop" "$BRIGHT"
    echo
    
    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        log "❌ curl is not installed. Please install curl to use this script." "$RED"
        exit 1
    fi
    
    # Initial ping
    ping_server
    
    # Main loop
    while true; do
        sleep "$PING_INTERVAL"
        ping_server
    done
}

# Check if RENDER_URL is set
if [ -z "$RENDER_URL" ]; then
    log "⚠️ RENDER_URL environment variable not set" "$YELLOW"
    log "💡 Using default URL: https://astro-luxe-guide.onrender.com" "$YELLOW"
    log "💡 To set custom URL: export RENDER_URL=https://your-app.onrender.com" "$YELLOW"
    echo
fi

# Start the service
main
