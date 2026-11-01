variable "project_id" {
  description = "ID of the Google Cloud project (the one the bootstrap configuration set up)."
  type        = string
}

variable "name_prefix" {
  description = "Prefix for every resource name (<prefix>-api, <prefix>-export, ...), so a fork can deploy its own copy."
  type        = string
  default     = "visual-tool"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,18}[a-z0-9]$", var.name_prefix))
    error_message = "Use 3 to 20 lowercase letters, digits and hyphens, starting with a letter and not ending in a hyphen."
  }
}

variable "firestore_database" {
  description = "Name of the Firestore database. The default one is the only one covered by the free tier."
  type        = string
  default     = "(default)"
}

variable "log_retention_days" {
  description = "How long the app's error lines are kept. Shorter keeps less; longer helps diagnose problems."
  type        = number
  default     = 7

  validation {
    condition     = var.log_retention_days >= 1 && var.log_retention_days <= 30
    error_message = "Use 1 to 30 days."
  }
}

variable "region" {
  description = "Region for Cloud Run, Firestore and Artifact Registry."
  type        = string
  default     = "europe-west2"
}

variable "api_public" {
  description = "Whether the API accepts requests from the internet. Off by default: set it to true, and apply, to open the site's backend."
  type        = bool
  default     = false
}

variable "billing_account" {
  description = "Billing account ID (ABCDEF-123456-7890AB) the budget alert is attached to."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository allowed to deploy, as owner/name."
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "Use the owner/name form, e.g. louis/visual-tool."
  }
}

variable "pages_origin" {
  description = "Origin of the site the API accepts requests from (scheme and host, no path), e.g. https://owner.github.io."
  type        = string
}

variable "budget_amount" {
  description = "Monthly budget in whole currency units. Alerts go out at 50%, 90% and 100% of it."
  type        = number
  default     = 5
}

variable "budget_currency" {
  description = "Currency of the budget. Must match the billing account's currency."
  type        = string
  default     = "USD"
}

variable "alert_email" {
  description = "Address that receives the budget alerts."
  type        = string
}
