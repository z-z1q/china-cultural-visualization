# 一卷山水，一方人居

中国传统民居数字长卷可视化应用

## 项目简介

「一卷山水，一方人居」是一个基于 Dash 和 Plotly 构建的中国传统民居数字长卷可视化平台。应用以地图为卷、以数据为墨，串联中国传统民居的山河分布、营造智慧与文化基因。用户可以通过交互式地图探索民居分布、对比不同地域的建筑特征、深入了解传统建筑的构造奥秘。

## 技术栈

- **后端框架**: [Dash](https://dash.plotly.com/) >= 2.18.0
- **可视化库**: [Plotly](https://plotly.com/python/) >= 5.24.0
- **数据处理**: [Pandas](https://pandas.pydata.org/) >= 2.2.0
- **科学计算**: [NumPy](https://numpy.org/) >= 1.26.0

## 项目结构

```
codev2/
├── app.py                  # 应用入口
├── requirements.txt        # 依赖列表
├── start.bat               # Windows 启动脚本
├── start.ps1               # PowerShell 启动脚本
├── start.sh                # Unix 启动脚本
├── assets/                 # 静态资源
│   ├── audio/              # 背景音乐
│   ├── models/             # 3D 模型文件 (gltf)
│   └── vendor/             # 第三方 JS 库
├── components/             # 可复用组件
│   └── navigation.py       # 导航栏组件
├── config/                 # 配置模块
│   ├── __init__.py
│   └── settings.py         # 应用配置
├── data/                   # 数据文件
│   ├── residences.csv      # 民居样本数据
│   ├── china_full.geojson  # 中国省级边界数据
│   └── README.md           # 数据说明
├── pages/                  # 页面模块
│   ├── home.py             # 首页
│   ├── explore.py          # 舆图（探索分析）
│   └── construction.py     # 营造（3D 构造展示）
├── services/               # 服务层
│   └── data_loader.py      # 数据加载与图表构建
└── utils/                  # 工具函数
```
## 项目展示

### 🏠 首页
![home](assets/home.png)

---

### 📊 数据分析页面
![explore](assets/explore.png)

---

### 🧱 3D展示页面
![construction](assets/construction.png)


## 功能特性

### 首页 (/)

展示项目概览与核心理念，包括：

- 交互式中国地图，展示民居样本的地域分布
- 数据统计指标（样本数、覆盖省份、建筑类型、朝代分期）
- 功能导览，引导用户深入探索

### 舆图 (/explore)

民居分布与数据分析的核心页面，提供：

- **地图交互**: 点击省份下钻，筛选特定地区的民居数据
- **时间轴筛选**: 通过朝代时间轴（先秦 → 当代）筛选不同历史时期的民居
- **地域板块过滤**: 按华北、东北、华东等地域板块筛选数据
- **建筑类型筛选**: 选择特定民居类型进行对比分析
- **平行坐标图**: 展示气候参数与建筑特征的关系
- **材料桑基图**: 可视化材料与建筑类型的流向
- **防震分析**: 等级分布与各省评分对比
- **南北对话**: 雷达图对比南北方建筑的差异
- **建筑密度热力图**: 展示民居的空间聚集特征
- **自然灾害适应性分析**: 分析建筑对不同气候条件的适应策略

### 营造 (/construction)

3D 建筑构造展示页面，包括：

- **建筑选择**: 支持四合院、徽派民居、桐寨鼓楼、吊脚楼、浙东台门、木楞房、蒙古包等7种传统建筑
- **拆解/组装**: 交互式查看建筑各部件
- **旋转控制**: 360度观察建筑结构
- **部件说明**: 点击部件查看详细的材料与工艺说明
- **结构类型**: 介绍抬梁式、穿斗式、干栏式、夯土版筑、井干式、斗拱层叠等结构体系

## 快速开始

### 环境要求

- Python 3.9+
- 现代浏览器（Chrome、Firefox、Edge 等）

**克隆或下载项目**

```Shell
cd code
```

### 安装依赖

```bash
pip install -r requirements.txt
```

**创建虚拟环境（推荐）**

```Shell
Windows
python -m venv venv
venv\Scripts\activate
macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

**运行项目**

```Shell
python app.py
```

### 启动应用

**Windows:**

```bash
# 使用批处理脚本
start.bat

# 或手动启动
python app.py
```

**Linux/macOS:**

```bash
chmod +x start.sh
./start.sh

# 或手动启动
python app.py
```

### 访问应用

启动后，在浏览器中访问: <http://127.0.0.1:8050>

## 数据说明

### 民居数据 (residences.csv)

| 字段              | 说明        |
| --------------- | --------- |
| id              | 唯一标识      |
| name            | 民居名称      |
| province        | 所属省份      |
| region          | 地域板块      |
| type            | 建筑类型      |
| dynasty         | 朝代分期      |
| material        | 主要材料      |
| area            | 建筑面积 (m²) |
| roof\_slope     | 屋顶坡度 (°)  |
| wall\_thickness | 墙体厚度 (m)  |
| window\_ratio   | 开窗比例      |
| rainfall        | 年降水量 (mm) |
| temperature     | 年均温 (°C)  |
| slope           | 地势坡度      |
| lon/lat         | 经纬度坐标     |

### 地图数据 (china\_full.geojson)

中国省级行政区边界数据，来源：自然资源部标准地图服务（审图号：GS(2024)0654号）

## 配置说明

应用配置位于 `config/settings.py`:

```python
APP_CONFIG = {
    "title": "一卷山水，一方人居",
    "description": "中国传统民居数字长卷",
    "version": "1.0.0",
    "debug": False,
    "host": "127.0.0.1",
    "port": 8050,
}
```

## 开发指南

### 添加新的建筑类型

1. 在 `config/settings.py` 的 `BUILDING_PARTS` 字典中添加新建筑配置
2. 在 `assets/models/` 目录下添加对应的 gltf 模型文件
3. 更新 `pages/construction.py` 中建筑选择下拉框的选项列表

### 添加新的可视化图表

1. 在 `services/data_loader.py` 中实现图表构建函数
2. 在 `pages/explore.py` 中添加回调函数处理数据更新

## 致谢

- 地图数据来源：自然资源部标准地图服务
- 参考典籍：《营造法式》
- 技术支持：Dash、Plotly 社区

