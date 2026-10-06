#!/usr/bin/env python3
"""Local Lottie player server. Serves the workspace folder (the parent of player/) and lists animations from ./lottie at /api/list."""
import http.server, json, os, socketserver, sys, webbrowser, threading
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOTTIE = os.path.join(ROOT, "lottie")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 8777
HOST = os.environ.get("HOST", "127.0.0.1")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
    def guess_type(self, path):
        t = super().guess_type(path)
        return t + "; charset=utf-8" if t.startswith("text/") else t
    def log_message(self, *a):
        pass
    def do_GET(self):
        if self.path.split("?")[0] == "/api/list":
            items = []
            for f in sorted(os.listdir(LOTTIE)):
                if f.endswith((".json", ".lottie")):
                    p = os.path.join(LOTTIE, f)
                    items.append({"name": f, "url": "/lottie/" + f, "size": os.path.getsize(p), "mtime": os.path.getmtime(p)})
            body = json.dumps(items).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path.split("?")[0] in ("/", "", "/player"):
            self.send_response(302)
            self.send_header("Location", "/player/")
            self.end_headers()
            return
        super().do_GET()

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

if __name__ == "__main__":
    os.makedirs(LOTTIE, exist_ok=True)
    srv = None
    for port in range(PORT, PORT + 10):
        try:
            srv = Server((HOST, port), Handler)
            break
        except OSError:
            # already running? then just open it
            try:
                import urllib.request
                urllib.request.urlopen(f"http://127.0.0.1:{port}/api/list", timeout=1)
                print(f"Player is already running: http://127.0.0.1:{port}/player/")
                webbrowser.open(f"http://127.0.0.1:{port}/player/")
                sys.exit(0)
            except SystemExit:
                raise
            except Exception:
                continue
    if srv is None:
        sys.exit(f"No free port in {PORT}-{PORT + 9}")
    port = srv.server_address[1]
    url = f"http://127.0.0.1:{port}/player/"
    print(f"Lottie player: {url}\nDrop .json / .lottie files into {LOTTIE}\nCtrl+C to stop.")
    if "--no-open" not in sys.argv:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    srv.serve_forever()
