"""
Quick test script to verify the FastAPI server can start successfully.
"""

import sys
import time
from multiprocessing import Process
import httpx


def run_server():
    """Run the FastAPI server."""
    import uvicorn
    from app.main import app
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="error")


def test_server_startup():
    """Test that the server starts and responds to requests."""
    # Start server in a separate process
    server_process = Process(target=run_server)
    server_process.start()
    
    # Give server time to start
    time.sleep(2)
    
    try:
        with httpx.Client() as client:
            # Test root endpoint
            response = client.get("http://127.0.0.1:8000/", timeout=5)
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "running"
            print("✓ Root endpoint working")
            
            # Test API info endpoint
            response = client.get("http://127.0.0.1:8000/api", timeout=5)
            assert response.status_code == 200
            print("✓ API info endpoint working")
            
            # Test OpenAPI docs
            response = client.get("http://127.0.0.1:8000/openapi.json", timeout=5)
            assert response.status_code == 200
            print("✓ OpenAPI documentation available")
            
            # Test that routers are accessible
            response = client.get("http://127.0.0.1:8000/api/racers", timeout=5)
            assert response.status_code == 200
            print("✓ Racer routes accessible")
        
        print("\n✅ Server startup test PASSED - All endpoints responding correctly")
        return True
        
    except Exception as e:
        print(f"\n❌ Server startup test FAILED: {e}")
        return False
        
    finally:
        # Stop server
        server_process.terminate()
        server_process.join(timeout=5)
        if server_process.is_alive():
            server_process.kill()


if __name__ == "__main__":
    success = test_server_startup()
    sys.exit(0 if success else 1)
