# 项目结构说明

## 根目录

```text
graduate_report_skill/
├── README.md
├── requirements.txt
├── LICENSE
├── THIRD_PARTY_NOTICES.md
├── SKILL.md
├── PROMPT_TEMPLATE.md
├── WORKFLOW.md
├── PROJECT_STRUCTURE.md
├── .gitignore
├── checklists/
├── figure_example/
└── paper_example/
```

## 目录作用

### 根目录文件

1. `README.md`：仓库总览、安装步骤和快速开始。
2. `requirements.txt`：仓库级 Python 依赖入口。
3. `LICENSE`：仓库原创内容许可证。
4. `THIRD_PARTY_NOTICES.md`：第三方文件与许可证说明。
5. `SKILL.md`、`PROMPT_TEMPLATE.md`、`WORKFLOW.md`：skill 规范、任务模板和工作流说明。

### `checklists/`

1. `FORMAT_REQUIREMENTS.md`：检查是否满足课程论文格式要求。
2. `DELIVERY_CHECKLIST.md`：提交前总检查。

### `figure_example/`

1. `generate_example_figures.py`：生成示例图表。
2. `style_config.py`：统一风格配置。
3. `requirements.txt`：Python 依赖。
4. `examples/`：图表输出与示例文件。

### `paper_example/`

1. `paper_template_cn.tex`：中文模板。
2. `paper_template_en.tex`：英文模板。
3. `compile.sh`：编译脚本。
4. `merge_papers.py`：合并 PDF。
5. `figures/`：正文图片目录。
6. `screenshots/`：可选截图目录。
7. `tables/`：可选表格目录。

## 推荐阅读顺序

1. `README.md`
2. `requirements.txt`
3. `LICENSE` / `THIRD_PARTY_NOTICES.md`
4. `SKILL.md`
5. `PROMPT_TEMPLATE.md`
6. `WORKFLOW.md`
7. `checklists/`
