import tkinter as tk
import webbrowser
import threading
from http.server import SimpleHTTPRequestHandler
from http.server import CGIHTTPRequestHandler
from http.server import ThreadingHTTPServer
from functools import partial
import contextlib
import sys
import os

print("随机点名工具启动成功，请点击桌面左上角“点”按钮。")

class DualStackServer(ThreadingHTTPServer):
    def server_bind(self):
        # suppress exception when protocol is IPv4
        with contextlib.suppress(Exception):
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        return super().server_bind()

def http_server(server_class=DualStackServer, handler_class=SimpleHTTPRequestHandler, port=5000, bind='127.0.0.1', cgi=False, directory=os.getcwd()):
    if cgi:
        handler_class = partial(CGIHTTPRequestHandler, directory=directory)
    else:
        handler_class = partial(SimpleHTTPRequestHandler, directory=directory)

    with server_class((bind, port), handler_class) as httpd:
        print(
            f"Serving HTTP on {bind} port {port} "
            f" (http://{bind}:{port}/) ..."
        )
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nKeyboard interrupt received, exiting.")
            sys.exit(0)


threading.Thread(target=http_server).start()


def open_url():
    webbrowser.open("http://127.0.0.1:5000")


# 创建主窗口
root = tk.Tk()
root.title("悬浮窗")
root.geometry("20x20")  # 设置窗口大小
root.overrideredirect(True)  # 去掉窗口边框
root.attributes("-topmost", True)  # 确保窗口总在最上层

# 设置不透明度为50%
root.wm_attributes("-alpha", 0.3)

# 创建按钮
button = tk.Button(root, text="点", command=open_url)
button.pack(expand=True, fill=tk.BOTH)  # 按钮填充整个窗口

# 设置窗口位置（例如在屏幕右上角）
screen_width = root.winfo_screenwidth()
root.geometry(f"+0+0")

# 运行主循环
root.mainloop()
