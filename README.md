# 🎨 Visionary

A powerful Streamlit app for advanced image generation and manipulation using Bria AI.

## 🌟 Features

- 🖼️ **Text-to-Image Generation**: Create stunning HD visuals from text prompts with various artistic styles (Realistic, Cartoon, Oil Painting, etc.) and aspect ratios.
- 🛍️ **Product Photography Studio**:
  - **Create Packshot**: Professional manufacturing shots with custom background colors and automatic background removal.
  - **Add Shadow**: Advanced shadow control with presets (Soft Drop, Hard Cast, Floating) and parametric adjustments (intensity, blur, direction).
  - **Lifestyle Shot**: Place products in any scene using text generation or reference images with smart placement.
- 🖌️ **Generative Fill**: Modify specific areas of an image by painting a mask and describing changes (inpainting).
- 🧼 **Erase Elements**: Clean up images by removing unwanted objects (magic eraser).
- ✨ **AI Prompt Enhancement**: Automatically refine your prompts for better generation results.
- � **Advanced Controls**: Fine-tune everything from shadow blur to generation seeds.

## 🚀 Quick Start

1. Clone the repository:
```bash
git clone https://github.com/Sameer-0904/adsnap-studio.git
cd adsnap-studio
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory:
```bash
BRIA_API_KEY=your_api_key_here
```

4. Run the app:
```bash
streamlit run app.py
```

## 💡 Usage

The app is organized into four main studios:

### 1. 🎨 Generate Image
- Enter a text prompt describing the image you want.
- Use **"✨ Enhance Prompt"** to let AI improve your description.
- Select a style (e.g., Realistic, Cyberpunk) and aspect ratio.
- Click **"Generate Images"**.

### 2. 🛍️ Product Photography
- **Upload** your product image.
- Choose a mode:
    - **Create Packshot**: Clean up the background and set a new color.
    - **Add Shadow**: Apply realistic shadows (Drop, Cast, Floating).
    - **Lifestyle Shot**: Place your product in a new scene using a text description or a reference image.

### 3. 🎨 Generative Fill
- **Upload** an image.
- **Draw** a mask over the area you want to change.
- **Type** a prompt describing what should fill that area.
- Click **"Generate"**.

### 4. 🧼 Erase Elements
- **Upload** an image.
- **Brush** over the object you want to remove.
- Click **"Erase Selected Area"**.

## 🔧 Configuration

**Visionary** offers granular control:

- **Styles**: Choose from diverse art styles for generation.
- **Shadows**: Customize shadow angle, blur, and opacity.
- **Placement**: Manually or automatically positioning products in lifestyle shots.
- **Content Moderation**: Toggle safety filters for strict or relaxed generation.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Bria AI](https://bria.ai) for their powerful image generation APIs
- [Streamlit](https://streamlit.io) for the amazing web framework 

## 📞 Contact

Developed by **Sameer Prajapati** 

Email: sameerprajapati0904@gmail.com