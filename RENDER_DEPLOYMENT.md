# Deploying Backend to Render

This guide will help you deploy your Astro Oracle backend to Render while keeping your frontend on Vercel.

## Prerequisites

1. A Render account (free tier available)
2. Your frontend already deployed on Vercel
3. Environment variables ready

## Step 1: Prepare Your Repository

Make sure your repository has the following files:
- `render.yaml` (deployment configuration)
- `Dockerfile` (container configuration)
- `.dockerignore` (excludes unnecessary files)
- `server/` directory with your backend code

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. **Connect your GitHub repository to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

2. **Configure Environment Variables:**
   - In your Render service dashboard, go to "Environment" tab
   - Add the following environment variables:
     ```
     NODE_ENV=production
     PORT=10000
     FRONTEND_URL=https://your-frontend-domain.vercel.app
     OPENAI_API_KEY=your_openai_api_key
     PROKERALA_API_KEY=your_prokerala_api_key
     PROKERALA_CLIENT_SECRET=your_prokerala_client_secret
     CHROMA_HOST=localhost
     CHROMA_PORT=8000
     RATE_LIMIT_WINDOW_MS=900000
     RATE_LIMIT_MAX_REQUESTS=100
     MAX_FILE_SIZE=10485760
     ```

3. **Update FRONTEND_URL:**
   - Replace `https://your-frontend-domain.vercel.app` with your actual Vercel frontend URL

### Option B: Manual Deployment

1. **Create a new Web Service:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service:**
   - **Name:** `astro-oracle-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
   - **Plan:** `Starter` (free tier)

3. **Add Environment Variables** (same as above)

## Step 3: Update Frontend Configuration

Once your backend is deployed, update your frontend to use the new backend URL:

1. **Update your frontend environment variables:**
   ```env
   VITE_BACKEND_URL=https://your-backend-name.onrender.com
   ```

2. **Update API calls in your frontend code** to use the new backend URL.

## Step 4: Test the Deployment

1. **Health Check:** Visit `https://your-backend-name.onrender.com/health`
2. **Test API endpoints** from your frontend
3. **Check logs** in Render dashboard for any errors

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | Yes |
| `PORT` | Server port (Render sets this automatically) | No |
| `FRONTEND_URL` | Your Vercel frontend URL | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes |
| `PROKERALA_API_KEY` | ProKerala API key | Yes |
| `PROKERALA_CLIENT_SECRET` | ProKerala client secret | Yes |
| `CHROMA_HOST` | ChromaDB host | No |
| `CHROMA_PORT` | ChromaDB port | No |

## Important Notes

1. **Free Tier Limitations:**
   - Render free tier services sleep after 15 minutes of inactivity
   - First request after sleep may take 30-60 seconds
   - Consider upgrading to paid plan for production use

2. **CORS Configuration:**
   - The backend is configured to accept requests from your Vercel frontend
   - Update `FRONTEND_URL` in environment variables

3. **File Uploads:**
   - Render's free tier has limitations on file storage
   - Consider using external storage (AWS S3, Cloudinary) for production

4. **ChromaDB:**
   - ChromaDB is configured for local use
   - For production, consider using a managed vector database

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check that all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **Environment Variables:**
   - Ensure all required variables are set in Render dashboard
   - Check for typos in variable names

3. **CORS Errors:**
   - Verify `FRONTEND_URL` is correctly set
   - Check that your frontend URL is in the CORS allowed origins

4. **API Timeouts:**
   - Render has request timeout limits
   - Consider optimizing long-running operations

### Getting Help:

- Check Render logs in the dashboard
- Review the health check endpoint: `/health`
- Monitor application performance in Render dashboard

## Next Steps

After successful deployment:

1. **Set up monitoring** in Render dashboard
2. **Configure custom domain** (optional)
3. **Set up automatic deployments** from your main branch
4. **Consider upgrading** to paid plan for better performance
