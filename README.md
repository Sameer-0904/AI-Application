# 🎨 Visionary

A powerful full-stack AI Design Studio for advanced image generation and manipulation using Bria AI. Built with **React** (Frontend) and **FastAPI** 

**Here is the demo link of Visionary**

<a href="https://visionary-t4kd.onrender.com">Visionary AI Studio</a>

## 🌟 Features

- 🖼️ **Text-to-Image Generation**: Create stunning HD visuals from text prompts with intelligent prompt enhancement, various artistic styles, and dynamic aspect ratios.
- 🛍️ **Product Studio**:
  - **Create Packshot**: Professional manufacturing shots with custom background colors and automatic background removal.
  - **Add Shadow**: Advanced shadow control with presets (Regular, Floating) and parametric adjustments.
  - **Lifestyle Shot**: Place products in any scene using smart text descriptions.
- 🖌️ **Generative Fill**: seamless inpainting to modify specific areas of an image with AI-generated content.
- 🔒 **Secure Architecture**: API keys are safely managed in the backend, never exposed to the client.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, CSS Modules (Built with AI assistance)
- **Backend**: FastAPI, Uvicorn, Python
- **AI Engine**: Bria AI API

## 🚀 Quick Start

### Prerequisites

- Node.js & npm
- Python 3.8+

### 1. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory and add your Bria API Key:

```env
BRIA_API_KEY=your_actual_api_key_here
```

Start the backend server:

```bash
uvicorn api:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd visionary-frontend
npm install
```

Start the development server:

```bash
npm run dev
```

Open your browser at `http://localhost:5173` (or the port shown in terminal).

## 💡 Usage

The app is organized into dedicated studios in the sidebar:

### 1. 🎨 Generate Image
- Enter a text prompt.
- Click **"Enhance Prompt"** to refine it automatically.
- Choose a style (e.g., Cartoon, Realistic) and Aspect Ratio.
- Click **"Generate"**.

### 2. 🛍️ Product Studio
- **Upload** your product image.
- Choose a workflow: **Packshot**, **Add Shadow**, or **Lifestyle Shot**.
- Configure parameters (Background color, Shadow type, Scene description).
- Click **"Process Image"**.

### 3. 🖌️ Generative Fill
- **Upload** an image.
- **Draw** a mask over the area to fill.
- **Describe** what should fill the area.
- Click **"Generate Fill"**.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Bria AI](https://bria.ai) for the powerful generative AI models.

## 📞 Contact

Developed by **Sameer Prajapati**

Email: sameerprajapati0904@gmail.com