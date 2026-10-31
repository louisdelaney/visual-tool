terraform {
  backend "gcs" {
    # Placeholder: set the bucket from the bootstrap output rather than editing
    # this file, with
    #   terraform init -backend-config="bucket=$(terraform -chdir=bootstrap output -raw state_bucket)"
    bucket = "REPLACE_WITH_PROJECT_ID-tfstate"
    prefix = "visual-tool"
  }
}
