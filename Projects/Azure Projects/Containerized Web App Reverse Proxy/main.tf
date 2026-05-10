terraform {
  required_version = ">= 1.5.0"

  required_providers {
    local = {
      source = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "local" {}

resource "local_file" "readme" {
  filename = "${path.module}/infra/README.txt"
  content = "Simulated architecture for a containerized web app with a reverse proxy."
}

resource "local_file" "reverse_proxy" {
  filename = "${path.module}/infra/reverse-proxy/proxy.conf"
  content = <<EOT
server {
    listen 80;

    location / {
        proxy_pass http://webapp:8080;
    }
}
EOT
}

resource "local_file" "web_app" {
  filename = "${path.module}/infra/webapp/config.env"
  content = <<EOT
APP_ENV=production
APP_PORT=8080
LOG_LEVEL=info
EOT
}

resource "local_file" "firewall_rules" {
  filename = "${path.module}/infra/network/firewall.rules"
  content = <<EOT
ALLOW: inbound HTTP (port 80)
ALLOW: inbound HTTPS (port 443)
DENY: all other inbound traffic
EOT
}

resource "local_file" "routing" {
  filename = "${path.module}/infra/network/routes.txt"
  content = <<EOT
ROUTE: /api -> webapp
ROUTE: / -> reverse-proxy
EOT
}