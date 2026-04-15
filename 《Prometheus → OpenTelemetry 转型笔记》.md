# Prometheus → OpenTelemetry 转型笔记

## 1. 为什么从 Prometheus 走向 OpenTelemetry

### 1.1 Prometheus 的局限

* 只能处理 **Metrics**
* 无法原生处理 **Logs / Traces / Events**
* 存储和查询方案碎片化 → Thanos / Cortex / Mimir 生态复杂
* Pull 模式对多语言、多运行时场景不友好
* 采集标准不统一（SDK、Exporter 各做各的）

### 1.2 OpenTelemetry 的优势

* **统一数据模型：Metrics / Logs / Traces / Events**
* **统一采集链路**（OTel SDK → Collector → Backend）
* 全云原生设计：组件可组合、可扩展
* 支持多种后端（Prometheus、Mimir、Loki、Tempo、Jaeger、Elastic…）
* 未来 CNCF 事实标准，可观测性厂商全面兼容

---

## 2. Prometheus → OTel 的转型总体路线

```
Prometheus → （共存期）→ Prometheus + OTel → （逐步替换）→ 全量 OTel
```

### 2.1 转型阶段划分

1. **共存期**（最重要）

   * 保留 Prometheus Server、Alertmanager 不动
   * 引入 OTel Collector 并让它向 Prometheus 暴露 scrape endpoint

2. **双写期**（平滑迁移）

   * 应用同时输出 Prometheus 指标 和 OTel 指标
   * Collector Remote Write → Prometheus / Mimir

3. **替换期**

   * 停止 Prometheus SDK
   * 全量使用 OTel SDK

4. **Prometheus 退出**（可选）

   * 只保留 OTel Collector + Mimir/ClickHouse/Tempo/Loki 等

---

## 3. OTel Collector 如何替代 Prometheus 的各能力

### 3.1 替代 Exporter

Prometheus 的 exporter（node-exporter, redis-exporter…）都可通过：

* OTel Prometheus Receiver
* OTel Host Metrics
* OTel SQL/Redis/NGINX Receiver

### 3.2 替代 Pushgateway

OTel 原生支持 push（OTLP）、batch、retry，无需 Pushgateway。

### 3.3 替代 Remote Write Queue

Collector 的 pipeline 默认具备：

* retry
* batching
* queue
* backpressure

### 3.4 替代 PromQL（部分）

OTel 不做查询，PromQL 由下游存储（Mimir、Prometheus、VictoriaMetrics）提供。

Collector 负责：

* 接收
* 转换
* 路由
* 导出

---

## 4. 迁移时要处理的核心问题

### 4.1 Metrics 名称变化（重大问题）

Prometheus SDK → `http_requests_total`
OTel SDK → `http.server.request_count`

迁移必须建立对照表，避免告警全部失效。

### 4.2 标签变动

Prom：`pod`, `namespace`
OTel：默认 `service.name`, `deployment.environment`

需要统一规范，例如：

```
service.name = app
k8s.pod.name = pod
k8s.namespace.name = namespace
```

### 4.3 Histogram 变更

OTel 默认 **native exponential histogram**。

如果后端仍用 Prometheus，需要使用：

```
metrics:
  enable_histogram_buckets: true
```

避免 Prometheus 不识别。

### 4.4 采集方式变化

Prom → 基于 HTTP Pull
OTel → SDK Push

迁移期间保持双通道：

* Collector 暴露 `/metrics` 给 Prometheus Scrape
* 同时将 OTLP 数据写入 Mimir/Tempo

---

## 5. 典型架构对比

### 5.1 原 Prometheus 架构

```
App → Prometheus Exporter → Prometheus Server → Thanos / Alertmanager
```

### 5.2 迁移后的架构

```
App (OTel SDK) → OTel Collector → Mimir/Tempo/Loki → Dashboard/Alerting

Prometheus Server （仍可在共存期使用）
```

---

## 6. 最佳实践

### 6.1 先从无破坏引入 Collector

```
Prometheus → scrape → OTel Collector
OTel Collector → Remote Write → Prometheus/Mimir
```

### 6.2 业务应用逐步引入 OTel SDK

从简单场景开始：HTTP、gRPC → DB → Cache → 队列 → 自定义指标。

### 6.3 评论：指标治理

必须同步处理指标规范：

* metric name
* attribute key
* histogram 规则
* 全链路 service.name

否则未来会很混乱。

### 6.4 保持 Prometheus 告警规则不变

Collector 提供转换层，让旧 PromQL 仍能工作。

---

## 7. 告警迁移方法

### 7.1 告警规则与 PromQL保留

不建议一次性迁移。

### 7.2 Collector 统一转换

在 Pipeline 中做：

```
attributes/transform
metricstransform
```

将 OTel metric 恢复成 Prometheus 风格。

### 7.3 Alertmanager 可继续使用

OTel 不负责告警，完全兼容。

---

## 8. 迁移 checklist

### 技术

* [ ] 是否已有 OTel Collector？
* [ ] 是否双写指标？
* [ ] 是否对齐 metric 命名？
* [ ] 是否兼容 histogram？
* [ ] 是否处理标签一致性？
* [ ] 是否完成告警兼容层？
* [ ] 是否完成 Mimir 后端？

### 组织

* [ ] 是否有可观测规范？
* [ ] 是否培训开发同学？
* [ ] 是否划分迁移“分批次”？

---

## 9. 结语：未来属于 OTel，但不属于替换

Prometheus 不会真正被淘汰，它会成为 **OTel 生态中的其中一个后端**。

OTel 是未来统一的采集、标准化数据模型；
Prometheus/Mimir 是未来统一的 Metrics 存储和查询。

两者长期共存，不是替代，而是升级。
