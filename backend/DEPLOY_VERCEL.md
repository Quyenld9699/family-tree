# Deploy NestJS Backend to Vercel

This guide explains how to deploy the NestJS backend to Vercel using the serverless configuration.

## Prerequisites

1.  **Vercel Account**: Create an account at [vercel.com](https://vercel.com).
2.  **Vercel CLI** (Optional): Install globally via `npm i -g vercel` for local testing.

## Configuration Files Created

We have added the following files to enable Vercel deployment:

1.  `backend/src/vercel.ts`: This is the entry point for the Vercel serverless function. It wraps the NestJS application in an Express adapter.
2.  `backend/vercel.json`: This configuration file tells Vercel how to build and route requests to the application.

## Deployment Steps

### Option 1: Deploy via Git Integration (Recommended)

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Go to the Vercel Dashboard and click **"Add New..."** -> **"Project"**.
3.  Import your repository.
4.  **Configure Project**:
    - **Root Directory**: Select `backend` (since your NestJS app is in the `backend` folder).
    - **Framework Preset**: Vercel should automatically detect it or select "Other".
    - **Build Command**: `nest build` (or leave default if it detects package.json scripts).
    - **Output Directory**: `dist` (standard for NestJS).
    - **Install Command**: `npm install` (or `yarn`).
5.  **Environment Variables**:
    - Copy all variables from your `backend/.env` file to the Vercel Environment Variables section.
    - Examples: `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, etc.
6.  Click **Deploy**.

### Option 2: Deploy via CLI

1.  Navigate to the `backend` directory in your terminal:
    ```bash
    cd backend
    ```
2.  Run the deploy command:
    ```bash
    vercel
    ```
3.  Follow the prompts to link the project.
4.  Set up environment variables in the Vercel dashboard or via CLI:
    ```bash
    vercel env add MONGO_URI
    # ... repeat for other variables
    ```
5.  Deploy to production:
    ```bash
    vercel --prod
    ```

## Important Notes

- **Cold Starts**: Serverless functions may have a slight delay (cold start) if they haven't been used recently.
- **Database Connections**: Ensure your MongoDB provider (e.g., MongoDB Atlas) allows connections from anywhere (0.0.0.0/0) or whitelist Vercel's IP ranges (which is harder as they change).
- **CORS**: The `vercel.ts` file enables CORS for all origins (`*`). Adjust this in production if needed.
