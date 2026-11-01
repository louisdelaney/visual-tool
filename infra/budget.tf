data "google_project" "this" {
  project_id = var.project_id

  depends_on = [google_project_service.apis]
}

resource "google_monitoring_notification_channel" "budget_email" {
  display_name = "${local.display_name} budget alerts"
  type         = "email"

  labels = {
    email_address = var.alert_email
  }

  depends_on = [google_project_service.apis]
}

# Emails at 50%, 90% and 100%, and publishes every update to the shutoff topic, which
# closes the API once the month's cost reaches the budget (shutoff.tf).
resource "google_billing_budget" "monthly" {
  billing_account = var.billing_account
  display_name    = "${local.display_name} monthly budget"

  budget_filter {
    projects = ["projects/${data.google_project.this.number}"]
  }

  amount {
    specified_amount {
      currency_code = var.budget_currency
      units         = tostring(floor(var.budget_amount))
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }

  threshold_rules {
    threshold_percent = 0.9
  }

  threshold_rules {
    threshold_percent = 1.0
  }

  all_updates_rule {
    monitoring_notification_channels = [google_monitoring_notification_channel.budget_email.id]
    pubsub_topic                     = google_pubsub_topic.shutoff.id
    disable_default_iam_recipients   = false
  }

  depends_on = [google_project_service.apis]
}
