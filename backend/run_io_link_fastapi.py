"""
Simple startup script for the FastAPI IO-Link Master backend
Run this script to start the FastAPI server on port 8000
"""

import uvicorn

if __name__ == "__main__":
    print("Starting IO-Link Master FastAPI Backend...")
    print("WebSocket endpoint: ws://localhost:8000/ws")
    print("API documentation: http://localhost:8000/docs")
    print("Press Ctrl+C to stop")
    
    uvicorn.run(
        "io_link_fastapi:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Set to True for development
        log_level="info"
    )
