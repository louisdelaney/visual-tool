# Applied once, by hand, with local state, to create the bucket that holds the
# main configuration's state (and the project itself, if asked). Sign in first:
#
#   gcloud auth application-default login
#
# Keep the small local terraform.tfstate this leaves behind somewhere safe. It
# only describes the project link and the state bucket, so losing it is
# recoverable (import the bucket), but nothing else depends on it.

resource "google_project" "this" {
  count = var.create_project ? 1 : 0

  name                = var.project_id
  project_id          = var.project_id
  org_id              = var.org_id
  folder_id           = var.folder_id
  billing_account     = var.billing_account
  auto_create_network = false
}

data "google_project" "this" {
  count = var.create_project ? 0 : 1

  project_id = var.project_id
}

resource "google_billing_project_info" "this" {
  count = var.create_project ? 0 : 1

  project         = data.google_project.this[0].project_id
  billing_account = var.billing_account
}

resource "google_storage_bucket" "tfstate" {
  name                        = "${var.project_id}-tfstate"
  project                     = var.project_id
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      with_state         = "ARCHIVED"
      num_newer_versions = 10
    }
    action {
      type = "Delete"
    }
  }

  lifecycle {
    prevent_destroy = true
  }

  # A bucket can only be created once the project has billing.
  depends_on = [
    google_project.this,
    google_billing_project_info.this,
  ]
}
