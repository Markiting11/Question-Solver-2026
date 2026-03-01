# Student Question Solver

An AI-powered study companion that explains answers in multiple formats including visual diagrams, step-by-step guides, and simplified summaries.

## 🚀 Deployment

This project is optimized for seamless deployment on **Netlify** and **Vercel**.

### 1. Prerequisites

- A [Google AI Studio](https://aistudio.google.com/app/apikey) API Key.

### 2. Deploy to Netlify

1. **Connect your Repository**: Connect your GitHub/GitLab/Bitbucket repository to Netlify.
2. **Build Settings**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. **Environment Variables**:
   - Go to **Site settings** > **Environment variables**.
   - Add `GEMINI_API_KEY` with your actual API key.
4. **Deploy**: Click "Deploy site".

### 3. Deploy to Vercel

1. **Import Project**: Import your repository into Vercel.
2. **Framework Preset**: Vercel should automatically detect **Vite**.
3. **Environment Variables**:
   - During the import process, expand the **Environment Variables** section.
   - Add `GEMINI_API_KEY` with your actual API key.
4. **Deploy**: Click "Deploy".

## 🛠 Local Development

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your `GEMINI_API_KEY`.
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📄 License

MIT
