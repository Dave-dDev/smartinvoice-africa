# GitHub Deployment Guide

This guide will help you deploy SmartInvoice Africa on GitHub Pages.

## Prerequisites

- GitHub account
- Git installed on your machine
- Node.js 18+ installed

## Step 1: Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository:
   - **Repository name**: `smartinvoice-africa`
   - **Description**: Smart Invoice & Expense Manager for African SMEs
   - **Visibility**: Public (required for free GitHub Pages)
   - Do NOT initialize with README, .gitignore, or license (we have these)

3. Click "Create repository"

## Step 2: Push Code to GitHub

In your project directory, run:

```bash
# Initialize git (if not already done)
git init

# Add GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/smartinvoice-africa.git

# Rename branch to main (if needed)
git branch -M main

# Stage all files
git add .

# Commit initial code
git commit -m "Initial commit: SmartInvoice Africa app"

# Push to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings**
3. In the left sidebar, click **Pages**
4. Under "Source", select:
   - **Deploy from a branch**
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
5. Click **Save**

## Step 4: Enable GitHub Actions

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Confirm that the "Deploy to GitHub Pages" workflow is enabled
4. The first deploy will start automatically (it may take 2-3 minutes)

## Step 5: Access Your Live Site

Once the deployment is complete:

- Go to **Settings** → **Pages**
- Your site will be available at: `https://YOUR_USERNAME.github.io/smartinvoice-africa/`
- The URL will be displayed in the Pages section

## Environment Variables

**Important**: The `.env` file is in `.gitignore` and won't be deployed.

For Supabase credentials to work in production, you have two options:

### Option 1: Use Repository Secrets (Recommended)

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Create secrets for your environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. Update `.github/workflows/deploy.yml` to use them:

```yaml
- name: Build
  run: npm run build
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

### Option 2: Use Public Environment Variables

If your Supabase URL is publicly accessible (it's designed to be), you can hardcode the URL in the app and only protect the API key.

## Updating Your Site

After initial setup, updates are automatic:

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```
3. The GitHub Actions workflow will automatically build and deploy your changes
4. Your site will be updated within 2-3 minutes

## Monitoring Deployments

Go to the **Actions** tab in your GitHub repository to see:

- Build progress
- Deployment logs
- Any errors that occur

## Troubleshooting

### Build Fails

- Check the Actions tab for error messages
- Ensure all dependencies are properly specified in `package.json`
- Make sure no environment variables are required for the build

### Site Not Updating

- Check that you're pushing to the correct branch (`main`)
- Wait a few minutes after push for the workflow to complete
- Verify the workflow ran successfully in the Actions tab

### Site Shows 404

Make sure in Settings → Pages, the source is set to `gh-pages` branch.

## Repository Structure Reminder

```
.github/
└── workflows/
    └── deploy.yml          # GitHub Actions deployment workflow

src/
├── App.jsx
├── index.jsx
├── components/
├── pages/
├── services/
├── lib/
├── hooks/
├── data/
└── styles/

package.json                # Build scripts for Vite
vite.config.js              # Vite configuration
```

## Next Steps

1. Set up Supabase credentials as mentioned above
2. Test the deployment by making a small change and pushing
3. Monitor your site performance using Vercel Analytics or similar

## Support

For GitHub Pages issues, see: https://docs.github.com/en/pages
For GitHub Actions issues, see: https://docs.github.com/en/actions
