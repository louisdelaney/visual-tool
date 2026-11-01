locals {
  service_name  = "${var.name_prefix}-api"
  repository_id = var.name_prefix

  # The nightly export, which .github/workflows/export.yml publishes on the "data" release.
  export_url = "https://github.com/${var.github_repository}/releases/download/data/visual-data.json.gz"

  api_account_id      = "${var.name_prefix}-api"
  deployer_account_id = "${var.name_prefix}-deployer"
  exporter_account_id = "${var.name_prefix}-exporter"
  shutoff_account_id  = "${var.name_prefix}-shutoff"
  shutoff_name        = "${var.name_prefix}-shutoff"

  # Pool and provider share an id; the pool is project-wide, so the prefix keeps
  # two copies in one project apart.
  wif_id = "${var.name_prefix}-github"

  display_name = var.name_prefix
}
