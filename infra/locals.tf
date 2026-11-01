locals {
  service_name    = "${var.name_prefix}-api"
  export_job_name = "${var.name_prefix}-export"
  repository_id   = var.name_prefix
  export_bucket   = "${var.name_prefix}-export-${var.project_id}"

  api_account_id       = "${var.name_prefix}-api"
  deployer_account_id  = "${var.name_prefix}-deployer"
  scheduler_account_id = "${var.name_prefix}-scheduler"

  # Pool and provider share an id; the pool is project-wide, so the prefix keeps
  # two copies in one project apart.
  wif_id = "${var.name_prefix}-github"

  display_name = var.name_prefix
}
