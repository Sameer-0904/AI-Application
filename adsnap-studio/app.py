import streamlit as st
import os
from dotenv import load_dotenv
from services import (
    lifestyle_shot_by_image,
    lifestyle_shot_by_text,
    add_shadow,
    create_packshot,
    enhance_prompt,
    generative_fill,
    generate_hd_image,
    erase_foreground
)
from PIL import Image
import io
import requests
import json
import time
import base64
from streamlit_drawable_canvas import st_canvas
import numpy as np
import warnings
from services.erase_foreground import erase_foreground

# Suppress warnings
warnings.filterwarnings("ignore", category=RuntimeWarning)


# Configure Streamlit page
st.set_page_config(
    page_title="Visionary",
    page_icon="🎨",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load environment variables
# Load environment variables
#from dotenv import load_dotenv, find_dotenv
# Try locating .env file explicitly
#dotenv_path = find_dotenv()
#if not dotenv_path:
    # Fallback: try looking in the current directory and parent directory of the script
    #current_dir = os.path.dirname(os.path.abspath(__file__))
    #potential_paths = [
        #os.path.join(current_dir, '.env'),
        #os.path.join(os.path.dirname(current_dir), '.env')
    #]
    #for path in potential_paths:
        #if os.path.exists(path):
            #dotenv_path = path
            #break

#if dotenv_path:
    #load_dotenv(dotenv_path, verbose=True)
#else:
    #load_dotenv(verbose=True)

# print("Loading environment variables from:", dotenv_path if dotenv_path else "default locations")

# Debug: Print environment variable status - REMOVED for security
# api_key = os.getenv("BRIA_API_KEY")


# --- START OF MODIFIED SECTION (Replaces dotenv and os.getenv loading) ---

def initialize_session_state():
    """Initialize session state variables, loading API key from st.secrets."""
    # Check if the key exists in st.secrets and load it.
    # st.secrets is preferred for deployment.
    if 'api_key' not in st.session_state:
        # Use st.secrets to securely load the key
        bria_key = st.secrets.get('BRIA_API_KEY')
        st.session_state.api_key = bria_key if bria_key else None
        
    # Generate Images Tab State
    if 'txt2img_urls' not in st.session_state:
        st.session_state.txt2img_urls = []
    # ... (rest of the session state initialization remains the same)
    if 'txt2img_result' not in st.session_state:
        st.session_state.txt2img_result = None
    if 'enhanced_prompt' not in st.session_state:
        st.session_state.enhanced_prompt = None
    if 'original_prompt' not in st.session_state:
        st.session_state.original_prompt = ""
        
    # Product Photography Tab State
    if 'product_result' not in st.session_state:
        st.session_state.product_result = None
    if 'product_pending' not in st.session_state:
        st.session_state.product_pending = []
        
    # Generative Fill Tab State
    if 'gen_fill_result' not in st.session_state:
        st.session_state.gen_fill_result = None
    if 'gen_fill_urls' not in st.session_state:
        st.session_state.gen_fill_urls = []
    if 'gen_fill_pending' not in st.session_state:
        st.session_state.gen_fill_pending = []
        
    # Erase Elements State
    if 'erase_result' not in st.session_state:
        st.session_state.erase_result = None

@st.cache_data
def download_image(url):
    """Download image from URL and return as bytes."""
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.content
    except Exception as e:
        st.error(f"Error downloading image: {str(e)}")
        return None

def apply_image_filter(image, filter_type):
    """Apply various filters to the image."""
    try:
        img = Image.open(io.BytesIO(image)) if isinstance(image, bytes) else Image.open(image)
        
        if filter_type == "Grayscale":
            return img.convert('L')
        elif filter_type == "Sepia":
            width, height = img.size
            pixels = img.load()
            for x in range(width):
                for y in range(height):
                    r, g, b = img.getpixel((x, y))[:3]
                    tr = int(0.393 * r + 0.769 * g + 0.189 * b)
                    tg = int(0.349 * r + 0.686 * g + 0.168 * b)
                    tb = int(0.272 * r + 0.534 * g + 0.131 * b)
                    img.putpixel((x, y), (min(tr, 255), min(tg, 255), min(tb, 255)))
            return img
        elif filter_type == "High Contrast":
            return img.point(lambda x: x * 1.5)
        elif filter_type == "Blur":
            return img.filter(Image.BLUR)
        else:
            return img
    except Exception as e:
        st.error(f"Error applying filter: {str(e)}")
        return None

def check_generated_images(pending_key, result_key, list_key=None):
    """Check if pending images are ready and update the display."""
    pending_list = st.session_state.get(pending_key, [])
    if pending_list:
        ready_images = []
        still_pending = []
        
        for url in pending_list:
            try:
                response = requests.head(url)
                # Consider an image ready if we get a 200 response with any content length
                if response.status_code == 200:
                    ready_images.append(url)
                else:
                    still_pending.append(url)
            except Exception as e:
                still_pending.append(url)
        
        # Update the pending URLs list
        st.session_state[pending_key] = still_pending
        
        # If we found any ready images, update the display
        if ready_images:
            st.session_state[result_key] = ready_images[0]  # Display the first ready image
            if list_key and len(ready_images) > 1:
                st.session_state[list_key] = ready_images  # Store all ready images
            return True
            
    return False

def auto_check_images(status_container, pending_key, result_key, list_key=None):
    """Automatically check for image completion a few times."""
    max_attempts = 3
    attempt = 0
    while attempt < max_attempts and st.session_state.get(pending_key):
        time.sleep(2)  # Wait 2 seconds between checks
        if check_generated_images(pending_key, result_key, list_key):
            status_container.success("✨ Image ready!")
            return True
        attempt += 1
    return False

@st.cache_data
def process_image_for_canvas(image_bytes, max_width=600):
    """Process image for canvas: resize and convert to RGB."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        img_width, img_height = image.size
        
        # Calculate new dimensions
        if img_width > max_width:
             aspect_ratio = img_height / img_width
             new_width = max_width
             new_height = int(new_width * aspect_ratio)
             image = image.resize((new_width, new_height))
        else:
             new_width = img_width
             new_height = img_height
             
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        return image, new_width, new_height
    except Exception as e:
        return None, 0, 0

def main():
    # Custom CSS
    st.markdown("""
    <style>
        /* Import Google Font */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

        html, body, [class*="css"] {
            font-family: 'Inter', sans-serif;
        }

        /* Hiding Streamlit default menu and footer for cleaner look */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}

        /* Modernize buttons */
        .stButton button {
            background-color: #4F46E5; /* Indigo-600 */
            color: white;
            border-radius: 8px;
            border: none;
            padding: 0.6rem 1.2rem;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .stButton button:hover {
            background-color: #4338CA; /* Indigo-700 */
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .stButton button:active {
            transform: translateY(1px);
        }
        
        /* Secondary buttons (if any) */
        div[data-testid="stForm"] .stButton button {
             background-color: #10B981; /* Emerald-500 */
        }
        
        /* Input fields styling */
        .stTextInput > div > div > input, .stTextArea > div > div > textarea {
            border-radius: 8px;
            border: 1px solid #E5E7EB;
        }
        .stTextInput > div > div > input:focus, .stTextArea > div > div > textarea:focus {
            border-color: #6366F1;
            box-shadow: 0 0 0 1px #6366F1;
        }

        /* Tab styling */
        .stTabs [data-baseweb="tab-list"] {
            gap: 24px;
        }
        .stTabs [data-baseweb="tab"] {
            height: 50px;
            white-space: pre-wrap;
            background-color: transparent;
            border-radius: 4px 4px 0 0;
            gap: 1px;
            padding-top: 10px;
            padding-bottom: 10px;
        }
        .stTabs [aria-selected="true"] {
            background-color: transparent;
            border-bottom: 2px solid #4F46E5;
            color: #4F46E5;
        }

    </style>
    """, unsafe_allow_html=True)

    st.title("Visionary")
    initialize_session_state()
    # Sidebar Info
    with st.sidebar:
        
        st.markdown("""
        ### ℹ️ About
        **Visionary** is your AI-powered creative companion.
        
        **Features:**
        - 🎨 Text-to-Image Generation
        - 🛍️ Product Photography
        - 🖌️ Generative Fill
        - 🧼 Object Erasure
        """)
        st.markdown("---")
        st.caption("Developed by Sameer Prajapati")

    # Main tabs
    tabs = st.tabs([
        "🎨 Generate Image",
        "🖼️ Lifestyle Shot",
        "🎨 Generative Fill",
        "🎨 Erase Elements"
    ])
    
    # Generate Images Tab
    with tabs[0]:
        st.header("Generate Images")
        
        col1, col2 = st.columns([2, 1])
        with col1:
            # Prompt input
            prompt = st.text_area("Enter your prompt", 
                                value="",
                                height=100,
                                key="prompt_input")
            
            # Store original prompt in session state when it changes
            if "original_prompt" not in st.session_state:
                st.session_state.original_prompt = prompt
            elif prompt != st.session_state.original_prompt:
                st.session_state.original_prompt = prompt
                st.session_state.enhanced_prompt = None  # Reset enhanced prompt when original changes
            
            # Enhanced prompt display
            if st.session_state.get('enhanced_prompt'):
                st.markdown("**Enhanced Prompt:**")
                st.markdown(f"*{st.session_state.enhanced_prompt}*")
            
            # Enhance Prompt button
            if st.button("✨ Enhance Prompt", key="enhance_button"):
                if not prompt:
                    st.warning("Please enter a prompt to enhance.")
                else:
                    with st.spinner("Enhancing prompt..."):
                        try:
                            result = enhance_prompt(st.session_state.api_key, prompt)
                            if result:
                                st.session_state.enhanced_prompt = result
                                st.success("Prompt enhanced!")
                                # st.rerun()  # Removed to prevent duplication/loops, session state updation is enough
                        except Exception as e:
                            st.error(f"Error enhancing prompt: {str(e)}")
                            
            # Debug information - REMOVED
            # st.write("Debug - Session State:", {
            #     "original_prompt": st.session_state.get("original_prompt"),
            #     "enhanced_prompt": st.session_state.get("enhanced_prompt")
            # })
        
        with col2:
            with st.expander("⚙️ Settings", expanded=True):
                num_images = st.slider("Number of images", 1, 4, 1)
                aspect_ratio = st.selectbox("Aspect ratio", ["1:1", "16:9", "9:16", "4:3", "3:4"])
                enhance_img = st.checkbox("Enhance image quality", value=True)
            
            with st.expander("🎨 Style", expanded=True):
                style = st.selectbox("Image Style", [
                    "Realistic", "Artistic", "Cartoon", "Sketch", 
                    "Watercolor", "Oil Painting", "Digital Art"
                ])
            
            # Determine the final prompt to use (Original or Enhanced)
            final_prompt = st.session_state.enhanced_prompt if st.session_state.get('enhanced_prompt') else prompt

            # Add style to the final prompt
            if style and style != "Realistic":
                final_prompt = f"{final_prompt}, in {style.lower()} style"
        
        st.divider()
        
        # Generate button
        if st.button("🎨 Generate Images", type="primary", use_container_width=True):
            # Ensure API key is available from env
            if not st.session_state.api_key:
                st.session_state.api_key = os.getenv('BRIA_API_KEY')
            
            if not st.session_state.api_key:
                st.error("API Key not found. Please contact the administrator.")
                return
                
            with st.spinner("🎨 Generating your masterpiece..."):
                try:
                    # Convert aspect ratio to proper format
                    result = generate_hd_image(
                        prompt=final_prompt,
                        api_key=st.session_state.api_key,
                        num_results=num_images,
                        aspect_ratio=aspect_ratio,
                        sync=True,
                        enhance_image=enhance_img,
                        medium="art" if style != "Realistic" else "photography",
                        prompt_enhancement=False,
                        content_moderation=True
                    )
                    
                    if result:
                        # Debug logging - REMOVED
                        # st.write("Debug - Raw API Response:", result)
                        
                        if isinstance(result, dict):
                            urls = []
                            if "result_url" in result:
                                urls.append(result["result_url"])
                            elif "result_urls" in result:
                                urls.extend(result["result_urls"])
                            elif "result" in result and isinstance(result["result"], list):
                                for item in result["result"]:
                                    if isinstance(item, dict) and "urls" in item:
                                        urls.extend(item["urls"])
                                    elif isinstance(item, list):
                                        urls.extend(item)
                            
                            if urls:
                                st.session_state.txt2img_urls = urls
                                st.session_state.txt2img_result = urls[0] # Keep main image as first one
                                st.success(f"✨ Successfully generated {len(urls)} image{'s' if len(urls) > 1 else ''}!")
                            else:
                                st.error("No image URLs found in response.")
                        else:
                            st.error("No valid result format found in the API response.")
                            
                except Exception as e:
                    st.error(f"Error generating images: {str(e)}")
        
        # Display generated images
        if st.session_state.txt2img_urls:
            st.markdown("### Generated Results")
            
            # Create rows of 2 columns
            cols = st.columns(2)
            for idx, img_url in enumerate(st.session_state.txt2img_urls):
                with cols[idx % 2]:
                    st.image(img_url, caption=f"Result {idx+1}", use_column_width=True)
                    
                    # unique key for each download button
                    img_data = download_image(img_url)
                    if img_data:
                        st.download_button(
                            f"⬇️ Download {idx+1}",
                            img_data,
                            f"generated_image_{idx+1}.png",
                            "image/png",
                            key=f"dl_btn_{idx}"
                        )
                        
        # Fallback for old session state or single image
        elif st.session_state.txt2img_result:
             st.markdown("### Generated Result")
             st.image(st.session_state.txt2img_result, caption="Generated Image", use_column_width=True)
             image_data = download_image(st.session_state.txt2img_result)
             if image_data:
                st.download_button(
                    "⬇️ Download Image",
                    image_data,
                    "generated_image.png",
                    "image/png"
                )



#________________________________________________________________________________________________________________________________    
    # Product Photography Tab
    with tabs[1]:
        st.header("Product Photography")
        
        # Main Layout: 2 Columns (Image vs Controls)
        col_display, col_controls = st.columns([1, 1], gap="large")
        
        # --- LEFT COLUMN: Image Display ---
        with col_display:
            st.markdown("### 📸 Image Viewer")
            
            uploaded_file = st.file_uploader("Upload Product Image", type=["png", "jpg", "jpeg", "pdf"], key="product_upload")
            
            if uploaded_file:
                with st.container(border=True):
                    st.image(uploaded_file, caption="Original Input", use_column_width=True)
            else:
                st.info("👈 Please upload an image to start.")

            # Display Result if available
            if st.session_state.get('product_result') and uploaded_file:
                st.divider()
                with st.container(border=True):
                    st.success("✨ Result Ready")
                    st.image(st.session_state.product_result, caption="Generated Result", use_column_width=True)
                    
                    image_data = download_image(st.session_state.product_result)
                    if image_data:
                        st.download_button(
                            "⬇️ Download Result",
                            image_data,
                            "edited_product.png",
                            "image/png",
                            type="primary",
                            use_container_width=True
                        )
            elif st.session_state.get('product_pending') and uploaded_file:
                st.divider()
                st.info("⏳ Processing... Check status below.")

        # --- RIGHT COLUMN: Controls ---
        with col_controls:
            if uploaded_file:
                st.markdown("### 🛠️ Studio Controls")
                
                # Mode Selection using Pills or Radio
                edit_mode = st.radio(
                    "Studio Mode",
                    ["Create Packshot", "Add Shadow", "Lifestyle Shot"],
                    horizontal=True,
                    label_visibility="collapsed"
                )
                
                st.divider()
                
                # Stack based on mode
                if edit_mode == "Create Packshot":
                    st.subheader("📦 Packshot Settings")
                    col1, col2 = st.columns(2)
                    with col1:
                        bg_color = st.color_picker("Background Color", "#FFFFFF")
                    with col2:
                        sku = st.text_input("SKU", placeholder="Optional")
                        
                    with st.expander("Advanced Settings"):
                        force_rmbg = st.checkbox("Force Background Removal", False)
                        content_moderation = st.checkbox("Enable Content Moderation", False)

                    if st.button("✨ Create Packshot", type="primary", use_container_width=True):
                        with st.spinner("Processing..."):
                            try:
                                if force_rmbg:
                                    from services.background_service import remove_background
                                    bg_result = remove_background(
                                        st.session_state.api_key,
                                        uploaded_file.getvalue(),
                                        content_moderation=content_moderation
                                    )
                                    if bg_result and "result_url" in bg_result:
                                        resp = requests.get(bg_result["result_url"])
                                        image_data = resp.content if resp.status_code == 200 else None
                                    else:
                                        st.error("Background removal failed")
                                        st.stop()
                                else:
                                    image_data = uploaded_file.getvalue()
                                
                                result = create_packshot(
                                    st.session_state.api_key,
                                    image_data,
                                    background_color=bg_color,
                                    sku=sku if sku else None,
                                    force_rmbg=force_rmbg,
                                    content_moderation=content_moderation
                                )
                                if result and "result_url" in result:
                                    st.session_state.product_result = result["result_url"]
                                    st.rerun()
                            except Exception as e:
                                st.error(f"Error: {e}")

                elif edit_mode == "Add Shadow":
                    st.subheader("👥 Shadow Studio")
                    
                    # Presets (omitted for brevity during search, but included implicitly by context)
                    shadow_presets = {
                        "Custom": {},
                        "Soft Drop": {"type": "Drop", "intensity": 40, "blur": 30, "x": 0, "y": 20},
                        "Hard Cast": {"type": "Drop", "intensity": 80, "blur": 5, "x": 10, "y": 10},
                        "Floating": {"type": "Float", "intensity": 60, "blur": 25, "width": 0, "height": 0},
                    }
                    preset = st.selectbox("Shadow Preset", list(shadow_presets.keys()), index=1)
                    defaults = shadow_presets.get(preset, {})

                    col_s1, col_s2 = st.columns(2)
                    with col_s1:
                        shadow_type_opts = ["Natural", "Drop", "Float"]
                        def_type_idx = shadow_type_opts.index(defaults.get("type", "Drop")) if "type" in defaults else 1
                        shadow_type = st.selectbox("Shadow Type", shadow_type_opts, index=def_type_idx, key=f"s_type_{preset}")
                        shadow_color = st.color_picker("Color", "#000000")
                    with col_s2:
                        bg_choice = st.radio("Background", ["Transparent", "Color"], horizontal=True)
                        bg_c = st.color_picker("Pick", "#ffffff") if bg_choice == "Color" else None

                    with st.expander("Parametric Controls", expanded=True):
                        intensity = st.slider("Intensity", 0, 100, defaults.get("intensity", 60), key=f"s_int_{preset}")
                        blur = st.slider("Blur", 0, 100, defaults.get("blur", 20), key=f"s_blur_{preset}")
                        col_xy1, col_xy2 = st.columns(2)
                        with col_xy1: x_off = st.number_input("X Offset", -100, 100, defaults.get("x", 0), key=f"s_x_{preset}")
                        with col_xy2: y_off = st.number_input("Y Offset", -100, 100, defaults.get("y", 15), key=f"s_y_{preset}")
                        
                        w_scale, h_scale = 0, 70
                        if shadow_type == "Float":
                            w_scale = st.slider("Width Scale", -100, 100, defaults.get("width", 0), key=f"s_w_{preset}")
                            h_scale = st.slider("Height Scale", -100, 100, defaults.get("height", 70), key=f"s_h_{preset}")

                    if st.button("👥 Apply Shadow", type="primary", use_container_width=True):
                        with st.spinner("Applying shadow..."):
                            try:
                                # Map UI types to API accepted types ("regular" or "float")
                                api_shadow_type = "float" if shadow_type == "Float" else "regular"
                                
                                res = add_shadow(
                                    st.session_state.api_key,
                                    image_data=uploaded_file.getvalue(),
                                    shadow_type=api_shadow_type,
                                    background_color=bg_c,
                                    shadow_color=shadow_color,
                                    shadow_offset=[x_off, y_off],
                                    shadow_intensity=intensity,
                                    shadow_blur=blur,
                                    shadow_width=w_scale if api_shadow_type=="float" else None,
                                    shadow_height=h_scale if api_shadow_type=="float" else None,
                                    force_rmbg=True
                                )
                                if res and "result_url" in res:
                                    st.session_state.product_result = res["result_url"]
                                    st.rerun()
                            except Exception as e:
                                st.error(f"Error: {e}")

                elif edit_mode == "Lifestyle Shot":
                    st.subheader("Location Shoot")
                    ls_mode = st.radio("Source", ["Text Description", "Reference Image"], horizontal=True)
                    
                    with st.expander("Product Placement", expanded=False):
                        placement = st.selectbox("Type", ["Original", "Automatic", "Manual Placement"])
                        positions = []
                        if placement == "Manual Placement":
                            positions = st.multiselect("Positions", ["Center", "Bottom Center", "Upper Left"], ["Center"])

                    if ls_mode == "Text Description":
                        scene = st.text_area("Describe the scene", height=100)
                        if st.button("Generate Scene", type="primary", use_container_width=True):
                            with st.spinner("Rendering..."):
                                try:
                                    res = lifestyle_shot_by_text(
                                        api_key=st.session_state.api_key,
                                        image_data=uploaded_file.getvalue(),
                                        scene_description=scene,
                                        placement_type=placement.lower().replace(" ", "_"),
                                        num_results=1,
                                        sync=True,
                                        manual_placement_selection=[p.lower().replace(" ", "_") for p in positions],
                                        force_rmbg=True
                                    )
                                    # Robust response parsing
                                    url = None
                                    if res:
                                        if "result_urls" in res and res["result_urls"]:
                                            url = res["result_urls"][0]
                                        elif "result_url" in res:
                                            url = res["result_url"]
                                        elif "urls" in res and res["urls"]:
                                            url = res["urls"][0]
                                        elif "result" in res:
                                            # Handle nested result structures
                                            if isinstance(res["result"], list) and res["result"]:
                                                item = res["result"][0]
                                                if isinstance(item, str): url = item
                                                elif isinstance(item, list) and item and isinstance(item[0], str): 
                                                    url = item[0]
                                                elif isinstance(item, dict):
                                                    if "urls" in item and item["urls"]: url = item["urls"][0]
                                                    elif "url" in item: url = item["url"]
                                    
                                    if url:
                                        st.session_state.product_result = url
                                        st.rerun()
                                    else:
                                        st.error(f"Could not extract image URL from response: {res}")
                                except Exception as e:
                                    st.error(f"Error: {e}")
                    else:
                        ref = st.file_uploader("Reference Image", ["png", "jpg"], key="ls_ref_upload")
                        if st.button("Transfer Style", type="primary", use_container_width=True) and ref:
                            with st.spinner("Rendering..."):
                                try:
                                    res = lifestyle_shot_by_image(
                                        api_key=st.session_state.api_key,
                                        image_data=uploaded_file.getvalue(),
                                        reference_image=ref.getvalue(),
                                        placement_type=placement.lower().replace(" ", "_"),
                                        num_results=1,
                                        sync=True,
                                        manual_placement_selection=[p.lower().replace(" ", "_") for p in positions],
                                        force_rmbg=True,
                                        enhance_ref_image=True,
                                        ref_image_influence=0.6
                                    )
                                    # Robust response parsing
                                    url = None
                                    if res:
                                        if "result_urls" in res and res["result_urls"]:
                                            url = res["result_urls"][0]
                                        elif "result_url" in res:
                                            url = res["result_url"]
                                        elif "urls" in res and res["urls"]:
                                            url = res["urls"][0]
                                        elif "result" in res:
                                            # Handle nested result structures
                                            if isinstance(res["result"], list) and res["result"]:
                                                item = res["result"][0]
                                                if isinstance(item, str): url = item
                                                elif isinstance(item, list) and item and isinstance(item[0], str): 
                                                    url = item[0]
                                                elif isinstance(item, dict):
                                                    if "urls" in item and item["urls"]: url = item["urls"][0]
                                                    elif "url" in item: url = item["url"]
                                    
                                    if url:
                                        st.session_state.product_result = url
                                        st.rerun()
                                    else:
                                        st.error(f"Could not extract image URL from response: {res}")
                                except Exception as e:
                                    st.error(f"Error: {e}")
            else:
                st.info("👈 Please upload an image in the left panel.")



#____________________________________________________________________________________________________________________________________
    # Generative Fill Tab
    # Generative Fill Tab
    with tabs[2]:
        st.header("🎨 Generative Fill")
        st.markdown("Draw a mask on the image and describe what you want to generate in that area.")
        
        uploaded_file = st.file_uploader("Upload Image", type=["png", "jpg", "jpeg"], key="fill_upload")
        if uploaded_file:
            # Create columns for layout
            col1, col2 = st.columns(2)
            
            # Initialize canvas variables to ensure scope access
            canvas_result = None
            
            with col1:
                st.markdown("### 🖼️ Input & Result")
                
                # Use cached image processing
                img, canvas_width, canvas_height = process_image_for_canvas(uploaded_file.getvalue(), max_width=600)
                
                if img:
                    # Add drawing canvas
                    col_brush1, col_brush2 = st.columns(2)
                    with col_brush1:
                        stroke_width = st.slider("Brush width", 1, 50, 20)
                    with col_brush2:
                        stroke_color = st.color_picker("Brush color", "#fff")
                    
                    drawing_mode = "freedraw"
                    
                    # Create canvas with background image
                    canvas_result = st_canvas(
                        fill_color="rgba(255, 255, 255, 0.0)",  # Transparent fill
                        stroke_width=stroke_width,
                        stroke_color=stroke_color,
                        drawing_mode=drawing_mode,
                        background_color="",  # Transparent background
                        background_image=img,  # Pass PIL Image directly
                        height=canvas_height,
                        width=canvas_width,
                        key="canvas",
                    )
                else:
                    st.error("Error processing image.")
                
                # --- RESULT DISPLAY SECTION (Moved to Left) ---
                if st.session_state.gen_fill_result:
                    st.divider()
                    st.markdown("### ✨ Generated Result")
                    st.image(st.session_state.gen_fill_result, caption="Generated Result", use_column_width=True)
                    image_data = download_image(st.session_state.gen_fill_result)
                    if image_data:
                        st.download_button(
                            "⬇️ Download Result",
                            image_data,
                            "generated_fill.png",
                            "image/png",
                            use_container_width=True
                        )
                elif st.session_state.gen_fill_pending:
                    st.divider()
                    st.info("Generation in progress... check status on the right.")

            with col2:
                # Wrap generation controls in a form to prevent re-runs while typing
                with st.form("gen_fill_form"):
                    st.markdown("### ⚙️ Generation Settings")
                    
                    # Options for generation
                    prompt = st.text_area("Prompt", placeholder="Describe what to generate...")
                    negative_prompt = st.text_area("Negative Prompt", placeholder="What to avoid using...", height=68)
                    
                    with st.expander("Advanced Settings", expanded=True):
                        num_results = st.slider("Number of variations", 1, 4, 1)
                        seed = st.number_input("Seed", min_value=0, value=0, help="Set to >0 for reproducibility")
                        sync_mode = st.checkbox("Synchronous Mode", False, help="Wait for results")
                        content_moderation = st.checkbox("Content Moderation", False)

                    st.divider()

                    # Form Submit Button
                    submitted = st.form_submit_button("🎨 Generate", type="primary", use_container_width=True)

                if submitted:
                    if not prompt:
                        st.error("Please enter a prompt.")
                    elif canvas_result.image_data is None:
                        st.error("Please draw a mask first.")
                    else:
                        # Convert canvas result to mask
                        mask_img = Image.fromarray(canvas_result.image_data.astype('uint8'), mode='RGBA')
                        mask_img = mask_img.convert('L')
                        
                        # Convert mask to bytes
                        mask_bytes = io.BytesIO()
                        mask_img.save(mask_bytes, format='PNG')
                        mask_bytes_val = mask_bytes.getvalue()
                        
                        # Convert uploaded image to bytes
                        image_bytes = uploaded_file.getvalue()
                        
                        with st.spinner("🎨 Generating..."):
                            try:
                                result = generative_fill(
                                    st.session_state.api_key,
                                    image_bytes,
                                    mask_bytes_val,
                                    prompt,
                                    negative_prompt=negative_prompt if negative_prompt else None,
                                    num_results=num_results,
                                    sync=sync_mode,
                                    seed=seed if seed != 0 else None,
                                    content_moderation=content_moderation
                                )
                                
                                if result:
                                    if sync_mode:
                                        if "urls" in result and result["urls"]:
                                            st.session_state.gen_fill_result = result["urls"][0]
                                            if len(result["urls"]) > 1:
                                                st.session_state.gen_fill_urls = result["urls"]
                                            st.success("✨ Done!")
                                            st.rerun()
                                        elif "result_url" in result:
                                            st.session_state.gen_fill_result = result["result_url"]
                                            st.success("✨ Done!")
                                            st.rerun()
                                    else:
                                        if "urls" in result:
                                            st.session_state.gen_fill_pending = result["urls"][:num_results]
                                            # Create containers for status
                                            status_container = st.empty()
                                            
                                            # Show initial status
                                            status_container.info(f"Accepted! Waiting for results...")
                                            
                                            # Try automatic checking
                                            if auto_check_images(status_container, "gen_fill_pending", "gen_fill_result", "gen_fill_urls"):
                                                st.rerun()
                                            
                                            # If still pending after auto-check
                                            st.rerun()

                            except Exception as e:
                                st.error(f"Error: {str(e)}")
                
                # Status for Async Mode (if not clicked just now)
                if st.session_state.gen_fill_pending:
                    st.info(f"Processing {len(st.session_state.gen_fill_pending)} images...")
                    if st.button("🔄 Refresh Status", key="gen_refresh"):
                         if check_generated_images("gen_fill_pending", "gen_fill_result", "gen_fill_urls"):
                             st.success("Ready!")
                             st.rerun()
                         else:
                             st.warning("Still processing...")


#___________________________________________________________________________________________________________________________________________
    # Erase Elements Tab
    with tabs[3]:
        st.header("🎨 Erase Elements")
        st.markdown("Upload an image and select the area you want to erase.")
        
        uploaded_file = st.file_uploader("Upload Image", type=["png", "jpg", "jpeg"], key="erase_upload")
        if uploaded_file:
            col1, col2 = st.columns(2)
            
            with col1:
                st.subheader("Input & Mask")
                
                # Use cached image processing
                img, canvas_width, canvas_height = process_image_for_canvas(uploaded_file.getvalue(), max_width=600)
                
                if img:
                    # Add drawing canvas using Streamlit's drawing canvas component
                    stroke_width = st.slider("Brush width", 1, 50, 20, key="erase_brush_width")
                    stroke_color = st.color_picker("Brush color", "#fff", key="erase_brush_color")
                    
                    # Create canvas with background image
                    canvas_result = st_canvas(
                        fill_color="rgba(255, 255, 255, 0.0)",  # Transparent fill
                        stroke_width=stroke_width,
                        stroke_color=stroke_color,
                        background_color="",  # Transparent background
                        background_image=img,  # Pass PIL Image directly
                        drawing_mode="freedraw",
                        height=canvas_height,
                        width=canvas_width,
                        key="erase_canvas",
                    )
                else:
                    st.error("Error processing image.")
                
                # Options for erasing
                content_moderation = st.checkbox("Enable Content Moderation", False, key="erase_content_mod")
                
                if st.button("🎨 Erase Selected Area", key="erase_btn", type="primary", use_container_width=True):
                    if not canvas_result.image_data is None:
                        with st.spinner("Erasing selected area..."):
                            try:
                                # Convert canvas result to mask
                                mask_img = Image.fromarray(canvas_result.image_data.astype('uint8'), mode='RGBA')
                                mask_img = mask_img.convert('L')
                                
                                # Convert uploaded image to bytes
                                image_bytes = uploaded_file.getvalue()
                                
                                result = erase_foreground(
                                    st.session_state.api_key,
                                    image_data=image_bytes,
                                    content_moderation=content_moderation
                                )
                                
                                if result:
                                    if "result_url" in result:
                                        st.session_state.erase_result = result["result_url"]
                                        st.success("✨ Area erased successfully!")
                                        st.rerun()
                                    else:
                                        st.error("No result URL in the API response. Please try again.")
                            except Exception as e:
                                st.error(f"Error: {str(e)}")
                                if "422" in str(e):
                                    st.warning("Content moderation failed. Please ensure the image is appropriate.")
                    else:
                        st.warning("Please draw on the image to select the area to erase.")
            
            with col2:
                st.subheader("Result")
                if st.session_state.erase_result:
                    st.image(st.session_state.erase_result, caption="Result", use_column_width=True)
                    image_data = download_image(st.session_state.erase_result)
                    if image_data:
                        st.download_button(
                            "⬇️ Download Result",
                            image_data,
                            "erased_image.png",
                            "image/png",
                            key="erase_download",
                            use_container_width=True
                        )
                else:
                    st.info("Result will appear here.")

if __name__ == "__main__":
    main() 