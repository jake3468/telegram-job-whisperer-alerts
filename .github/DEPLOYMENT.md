
# 🚀 Deployment Guide

This repository uses a two-branch deployment strategy with automated CI/CD pipelines.

## 📋 Branch Strategy

- **`main`**: Development branch where Lovable pushes changes
- **`production`**: Production branch that triggers live deployments

## 🔄 Automated Workflows

### 1. Auto Production PR (`auto-production-pr.yml`)
- **Trigger**: When changes are pushed to `main` branch
- **Action**: Creates a Pull Request from `main` to `production`
- **Purpose**: Review changes before production deployment

### 2. Main Deployment (`deploy.yml`)
- **Trigger**: Push to `main` or `production` branches
- **Actions**:
  - `main` branch: Deploys to development/preview environment
  - `production` branch: Triggers production deployment to Netlify

### 3. Manual Deployment (`manual-deploy.yml`)
- **Trigger**: Manual workflow dispatch
- **Purpose**: Emergency deployments or specific environment targeting
- **Safety**: Requires typing "CONFIRM" for production deployments

## 🚀 Deployment Process

### Standard Deployment Flow:
1. Make changes in Lovable → automatically pushes to `main`
2. GitHub Actions creates a PR from `main` to `production`
3. Review the PR and check all changes
4. Merge the PR when ready to deploy
5. Production deployment triggers automatically

### Emergency/Manual Deployment:
1. Go to GitHub Actions tab
2. Select "Manual Deployment" workflow
3. Click "Run workflow"
4. Choose environment and confirm if production
5. Monitor the deployment progress

## ⚙️ Environment Variables

Make sure these are configured in your GitHub repository secrets:
- `VITE_CLERK_PUBLISHABLE_KEY_DEV`: Development Clerk key
- `VITE_CLERK_PUBLISHABLE_KEY_PROD`: Production Clerk key

## 🔒 Branch Protection (Recommended)

Set up branch protection rules for the `production` branch:
1. Go to Settings → Branches
2. Add rule for `production` branch
3. Enable:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Restrict pushes that create matching branches

## 📱 Notifications

The automated PR will include:
- Summary of changes
- Pre-deployment checklist
- Deployment instructions
- Automatic labels for easy tracking

## 🆘 Troubleshooting

**PR not created automatically?**
- Check if a PR from `main` to `production` already exists
- Verify GitHub Actions have proper permissions

**Deployment failed?**
- Check GitHub Actions logs
- Verify environment variables are set
- Ensure all dependencies are properly installed

**Need to rollback?**
- Create a new PR with the previous working commit
- Or use the manual deployment workflow with a specific commit/branch
