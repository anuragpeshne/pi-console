import os
import errno
import socket
import threading

FIFO = '/tmp/pi-console-fifo'
WEBSOCKET_PORT = 9876
WEBSERVER_PORT = 8888
connection_list = []

def make_fifo():
    try:
        os.mkfifo(FIFO, os.O_RDONLY)
    except OSError as oe:
        if oe.errno != errno.EEXIST:
            raise

def listen_fifo_forever():
    # https://stackoverflow.com/a/39089792/1291435
    while True:
        print("opening FIFO")
        with open(FIFO) as fifo:
            buffer = []
            while True:
                data = fifo.read()
                if len(data) == 0:
                    for connection in connection_list:
                        connection.send(pad_websocket_frame('\n'.join(buffer)))
                    fifo.close()
                    break
                buffer.append(data)
                print('read: ' + data.strip())

def pad_websocket_frame(string):
    return '\x00' + string + '\xff'

def send_websocket_header(connection):
    header = '''
HTTP/1.1 101 Web Socket Protocol Handshake\r
Upgrade: WebSocket\r
Connection: Upgrade\r
WebSocket-Origin: http://localhost:<WEBSERVER_PORT>\r
WebSocket-Location: ws://localhost:<WEBSOCKET_PORT/\r
WebSocket-Protocol: sample
    '''
    header = header\
        .replace('<WEBSERVER_PORT>', str(WEBSERVER_PORT))\
        .replace('<WEBSOCKET_PORT>', str(WEBSOCKET_PORT))\
        .strip()\
        + '\r\n\r\n'
    connection.send(header)

# makeshift websocket server
# https://yz.mit.edu/wp/web-sockets-tutorial-with-simple-python-server/
def accept_websocket_connection():
    s = socket.socket()
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(('', WEBSOCKET_PORT))
    s.listen(True)
    while True:
        connection, _ = s.accept()
        send_websocket_header(connection)
        connection_list.append(connection)


if __name__ == "__main__":
    make_fifo()
    threading.Thread(target = listen_fifo_forever).start()
    accept_websocket_connection()
