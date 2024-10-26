import tkinter as tk
import webbrowser
import threading
import http.server


def http_server():
    PORT = 5000
    Handler = http.server.SimpleHTTPRequestHandler
    with http.server.HTTPServer(("127.0.0.1", PORT), Handler) as httpd:
        print("serving at port", PORT)
        httpd.serve_forever()


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
root.wm_attributes("-alpha", 0.5)

# 创建按钮
button = tk.Button(root, text="点", command=open_url)
button.pack(expand=True, fill=tk.BOTH)  # 按钮填充整个窗口

# 设置窗口位置（例如在屏幕右上角）
screen_width = root.winfo_screenwidth()
root.geometry(f"+0+0")

# 运行主循环
root.mainloop()
