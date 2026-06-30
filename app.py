from __future__ import annotations

import logging
import sys
from pathlib import Path

from dash import Dash, html, page_container

from components.navigation import build_navbar
from config import APP_CONFIG


def setup_logging() -> None:
    """配置应用日志系统"""
    log_dir = Path(__file__).parent / "logs"
    log_dir.mkdir(exist_ok=True)

    # 配置根 logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # 格式器
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)
    root_logger.addHandler(console_handler)

    # 文件处理器
    file_handler = logging.FileHandler(log_dir / "app.log", encoding="utf-8")
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)
    root_logger.addHandler(file_handler)


setup_logging()
logger = logging.getLogger(__name__)


app = Dash(
    __name__,
    use_pages=True,
    suppress_callback_exceptions=True,
    title=APP_CONFIG["title"],
    description=APP_CONFIG["description"],
)
server = app.server

app.layout = html.Div(
    className="app-shell",
    children=[
        build_navbar(),
        html.Audio(
            id="guqin-audio",
            src="/assets/audio/古风.mp3",
            className="guqin-player",
            loop=True,
            preload="auto",
        ),
        page_container,
    ],
)


if __name__ == "__main__":
    logger.info(f"启动应用: {APP_CONFIG['title']} v{APP_CONFIG['version']}")
    logger.info(f"监听地址: http://{APP_CONFIG['host']}:{APP_CONFIG['port']}")
    app.run(
        debug=APP_CONFIG["debug"],
        host=APP_CONFIG["host"],
        port=APP_CONFIG["port"],
    )
