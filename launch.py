"""Host only the game assets on the home network. Python 3, no dependencies."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlsplit
import json
import re
from datetime import date
import subprocess
import sys
import webbrowser

ROOT = Path(__file__).resolve().parent
PORT = 8767
SAVES = ROOT / 'saves'
SAVE_FILE = SAVES / 'spelling.json'
class GameHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.m4a': 'audio/mp4', '.js': 'text/javascript'}
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def send_head(self):
        path = urlsplit(self.path).path
        if path not in ('/', '/index.html', '/app.js', '/style.css', '/audio/clips.js') and not re.fullmatch(r'/audio/[0-9a-f]{12}\.m4a', path):
            self.send_error(404)
            return None
        return super().send_head()
    def do_POST(self):
        # Backup of the spelling monsters, so clearing Safari can't lose them.
        if urlsplit(self.path).path != '/api/save':
            return self.send_error(404)
        length = int(self.headers.get('Content-Length') or 0)
        if not 0 < length <= 2_000_000:
            return self.send_error(413)
        try:
            data = json.loads(self.rfile.read(length))
            assert isinstance(data, dict) and isinstance(data.get('spell'), dict)
        except (ValueError, AssertionError):
            return self.send_error(400)
        SAVES.mkdir(exist_ok=True)
        text = json.dumps(data)
        tmp = SAVE_FILE.with_suffix('.tmp')
        tmp.write_text(text)
        tmp.replace(SAVE_FILE)
        (SAVES / f'backup-{date.today()}.json').write_text(text)
        self.send_response(204)
        self.end_headers()
    def do_GET(self):
        if urlsplit(self.path).path == '/api/save':
            if not SAVE_FILE.is_file():
                return self.send_error(404)
            body = SAVE_FILE.read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        # iPad Safari only plays audio from servers that honor byte-range requests (206).
        path = urlsplit(self.path).path
        rng = self.headers.get('Range')
        if not (rng and re.fullmatch(r'/audio/[0-9a-f]{12}\.m4a', path)):
            return super().do_GET()
        file = ROOT / path.lstrip('/')
        if not file.is_file():
            return self.send_error(404)
        data = file.read_bytes()
        size = len(data)
        m = re.fullmatch(r'bytes=(\d*)-(\d*)', rng.strip())
        if not m or (m.group(1) == '' and m.group(2) == ''):
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.end_headers()
            return
        if m.group(1) == '':
            first, last = max(0, size - int(m.group(2))), size - 1
        else:
            first = int(m.group(1))
            last = min(int(m.group(2)), size - 1) if m.group(2) else size - 1
        if first >= size or first > last:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.end_headers()
            return
        self.send_response(206)
        self.send_header('Content-Type', 'audio/mp4')
        self.send_header('Content-Range', f'bytes {first}-{last}/{size}')
        self.send_header('Content-Length', str(last - first + 1))
        self.end_headers()
        self.wfile.write(data[first:last + 1])
    def end_headers(self):
        if re.fullmatch(r'/audio/[0-9a-f]{12}\.m4a', urlsplit(self.path).path):
            self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

def main():
    url = f'http://127.0.0.1:{PORT}/'
    try:
        ip = subprocess.check_output(['ipconfig', 'getifaddr', 'en0'], text=True).strip()
    except (OSError, subprocess.CalledProcessError):
        ip = 'YOUR-MAC-WIFI-ADDRESS'
    print(f'On a tablet, open http://{ip}:{PORT}/ in Safari.', flush=True)
    print('Use the same Wi-Fi as this Mac. Keep the Mac awake and this window open.', flush=True)
    try:
        with urlopen(url, timeout=1) as response:
            running = b'Monster Math' in response.read(2048)
    except OSError:
        running = False
    if running:
        if '--no-browser' not in sys.argv:
            webbrowser.open(url)
        return
    try:
        server = ThreadingHTTPServer(('0.0.0.0', PORT), GameHandler)
    except OSError as exc:
        print(f'Could not start the game: {exc}', flush=True)
        raise SystemExit(1)
    if '--no-browser' not in sys.argv:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
if __name__ == '__main__':
    main()
