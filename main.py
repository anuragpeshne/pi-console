import os
import errno
import threading

import SimpleHTTPServer
import SocketServer
from SimpleWebSocketServer import SimpleWebSocketServer, WebSocket

FIFO = '/tmp/pi-console-fifo'
HTTP_PORT = 8000
SOCK_PORT = 8001
client_list = []

def make_fifo():
    try:
        os.mkfifo(FIFO, os.O_RDONLY)
    except OSError as oe:
        if oe.errno != errno.EEXIST:
            raise

def listen_fifo_forever():
    # https://stackoverflow.com/a/39089792/1291435
    while True:
        with open(FIFO) as fifo:
            buffer = []
            while True:
                data = fifo.read()
                if len(data) == 0:
                    for client in client_list:
                        client.sendMessage('\n'.join(buffer))
                    fifo.close()
                    break
                buffer.append(data)

class WebSocketServer(WebSocket):

    def handleMessage(self):
        print('Got Message: ' + self.data)

    def handleConnected(self):
        client_list.append(self)

    def handleClose(self):
        client_list.remove(self)

if __name__ == "__main__":
    websocketserver = SimpleWebSocketServer('', SOCK_PORT, WebSocketServer)
    sock_thread = threading.Thread(target = websocketserver.serveforever)
    sock_thread.daemon = True
    sock_thread.start()

    httpd = SocketServer.TCPServer(("", HTTP_PORT), SimpleHTTPServer.SimpleHTTPRequestHandler)
    httpd_thread = threading.Thread(target = httpd.serve_forever)
    httpd_thread.daemon = True
    httpd_thread.start()

    make_fifo()
    listen_fifo_forever()
