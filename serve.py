#!/usr/bin/env python3
"""
Local Development Server with Clean URL Support
Mimics Apache's mod_rewrite behavior for testing cPanel deployment locally
"""

import os
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, unquote

class CleanURLHandler(SimpleHTTPRequestHandler):
    """
    Custom HTTP handler that supports clean URLs (without .html extension)
    Mimics the .htaccess rewrite rules used in cPanel deployment
    """
    
    def _rewrite_path(self):
        parsed_path = urlparse(self.path)
        path = unquote(parsed_path.path)
        
        # Remove trailing slash for non-root paths
        if path != '/' and path.endswith('/'):
            dir_path = '.' + path
            index_path = dir_path + 'index.html'
            if os.path.isdir(dir_path) and os.path.isfile(index_path):
                self.path = path.rstrip('/') + '/index.html'
                if parsed_path.query:
                    self.path += '?' + parsed_path.query
                return
        
        # Try to serve the file directly first
        file_path = '.' + path
        
        # If path doesn't have extension and file doesn't exist
        if not os.path.exists(file_path) and not path.endswith('/'):
            # Try adding .html extension
            html_path = file_path + '.html'
            if os.path.isfile(html_path):
                self.path = path + '.html'
                if parsed_path.query:
                    self.path += '?' + parsed_path.query
                return
        
        # If it's a directory, try index.html
        if os.path.isdir(file_path):
            index_path = os.path.join(file_path, 'index.html')
            if os.path.isfile(index_path):
                self.path = path.rstrip('/') + '/index.html'
                if parsed_path.query:
                    self.path += '?' + parsed_path.query
                return

    # Legacy routes, kept in step with the RewriteRules in .htaccess. Renaming a
    # directory silently breaks every external link to the old path, so the pair
    # of implementations has to agree here too, not just on clean URLs.
    LEGACY_REDIRECTS = {
        '/budget': '/transparency',
    }

    def _redirect_legacy(self):
        path = unquote(urlparse(self.path).path).rstrip('/')
        for old, new in self.LEGACY_REDIRECTS.items():
            if path == old or path.startswith(old + '/'):
                self.send_response(301)
                self.send_header('Location', new + path[len(old):] or new + '/')
                self.end_headers()
                return True
        return False

    def do_GET(self):
        if self._redirect_legacy():
            return
        self._rewrite_path()
        return super().do_GET()

    def do_HEAD(self):
        if self._redirect_legacy():
            return
        self._rewrite_path()
        return super().do_HEAD()

    def log_message(self, format, *args):
        # Custom logging with color for clean URL rewrites
        message = format % args
        if '.html' not in self.path and 'GET' in message:
            # This was a clean URL that got rewritten
            print(f"\033[0;32m{self.address_string()}\033[0m - {message}")
        else:
            print(f"{self.address_string()} - {message}")

def run_server(port=8000, directory='.'):
    """Run the development server with clean URL support"""
    
    # Change to the specified directory
    if directory != '.':
        if not os.path.isdir(directory):
            print(f"Error: Directory '{directory}' not found")
            sys.exit(1)
        os.chdir(directory)
    
    ThreadingHTTPServer.allow_reuse_address = True
    ThreadingHTTPServer.daemon_threads = True
    server_address = ('', port)

    try:
        httpd = ThreadingHTTPServer(server_address, CleanURLHandler)
    except OSError as e:
        print(f"\n[Error] Could not bind to port {port}: {e}")
        print(f"[Tip] Port {port} might already be in use. Try specifying another port, e.g.:")
        print(f"      npm run dev -- -p 8080\n")
        sys.exit(1)
    
    print("=" * 60)
    print("Clean URL Development Server")
    print("=" * 60)
    print(f"Serving from: {os.getcwd()}")
    print(f"Server running at: http://localhost:{port}")
    print()
    print("Clean URLs supported:")
    print("  /travel/attractions       ->  serves attractions.html")
    print("  /travel/accommodations    ->  serves accommodations.html")
    print("  /travel/food              ->  serves food.html")
    print("  /travel/experience        ->  serves experience.html")
    print()
    print("Press Ctrl+C to stop")
    print("=" * 60)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Local server with clean URL support')
    parser.add_argument('-p', '--port', type=int, default=8888, help='Port number (default: 8888)')
    parser.add_argument('-d', '--directory', type=str, default='dist', help='Directory to serve (default: dist)')
    args = parser.parse_args()
    
    run_server(port=args.port, directory=args.directory)
