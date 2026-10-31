variable "project_id" {
  description = "ID of the Google Cloud project that holds everything."
  type        = string
}

variable "create_project" {
  description = "Create the project. Leave false to use a project that already exists."
  type        = bool
  default     = false
}

variable "org_id" {
  description = "Organization to create the project in. Only used when create_project is true."
  type        = string
  default     = null
}

variable "folder_id" {
  description = "Folder to create the project in. Only used when create_project is true. Set this or org_id, not both."
  type        = string
  default     = null

  validation {
    condition     = var.folder_id == null || var.org_id == null
    error_message = "Set folder_id or org_id, not both."
  }
}

variable "billing_account" {
  description = "Billing account ID (ABCDEF-123456-7890AB) to link to the project."
  type        = string
}

variable "region" {
  description = "Region for the state bucket."
  type        = string
  default     = "europe-west2"
}
