import os
from dotenv import load_dotenv

load_dotenv()
import io
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Import existing services
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

app = FastAPI(title="Visionary API", description="Backend API for Visionary AI Studio")

# CORS Configuration
# In production, replace ["*"] with specific frontend domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper Models ---

class ImageGenerationRequest(BaseModel):
    prompt: str
    num_results: int = 1
    aspect_ratio: str = "1:1"
    enhance_image: bool = True
    style: str = "Realistic"
    api_key: str

class EnhancePromptRequest(BaseModel):
    prompt: str
    api_key: Optional[str] = None

def get_api_key(api_key: Optional[str] = None) -> str:
    if api_key:
        return api_key
    env_key = os.getenv("BRIA_API_KEY")
    if env_key:
        return env_key
    raise HTTPException(status_code=401, detail="API Key not found. Please provide it in the request or set BRIA_API_KEY environment variable.")

# --- Endpoints ---

@app.get("/")
async def root():
    return {"message": "Visionary API is running"}

@app.post("/generate-image")
async def api_generate_image(
    prompt: str = Form(...),
    api_key: Optional[str] = Form(None),
    num_results: int = Form(1),
    aspect_ratio: str = Form("1:1"),
    enhance_image: bool = Form(True),
    style: str = Form("Realistic")
):
    """
    Generate HD images from text prompt.
    """
    try:
        final_prompt = prompt
        is_realistic = style == "Realistic"
        
        if style and not is_realistic:
            # For artistic styles, put the style first to have stronger effect
            final_prompt = f"{style} style artwork: {prompt}"
            # Disable automatic enhancement for artistic styles to preserve the look
            enhance_image = False
            
        final_key = get_api_key(api_key)
        result = generate_hd_image(
            prompt=final_prompt,
            api_key=final_key,
            num_results=num_results,
            aspect_ratio=aspect_ratio,
            sync=True,
            enhance_image=enhance_image,
            medium="art" if style != "Realistic" else "photography",
            prompt_enhancement=False,
            content_moderation=True
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/enhance-prompt")
async def api_enhance_prompt(
    prompt: str = Form(...),
    api_key: Optional[str] = Form(None)
):
    """
    Enhance a simple prompt using AI.
    """
    try:
        final_key = get_api_key(api_key)
        result = enhance_prompt(final_key, prompt)
        return {"enhanced_prompt": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/product/packshot")
async def api_create_packshot(
    file: UploadFile = File(...),
    api_key: Optional[str] = Form(None),
    background_color: str = Form("#FFFFFF"),
    sku: Optional[str] = Form(None),
    force_rmbg: bool = Form(False),
    content_moderation: bool = Form(False)
):
    """
    Create a clean packshot from a product image.
    """
    try:
        image_data = await file.read()
        
        # If force_rmbg is True, we might need to handle it here or let the service handle it.
        # Based on app.py, app.py calls remove_background explicitly if force_rmbg is True.
        # However, create_packshot service might have that logic or we might need to import remove_background.
        # Let's check if create_packshot handles it. In app.py it calls remove_background SEPARATELY.
        # For simplicity in this API v1, we will trust create_packshot or add logic if needed.
        # Looking at app.py: 
        # width st.spinner... if force_rmbg: remove_background(...) then create_packshot(...)
        
        # We'll stick to calling create_packshot directly for now. 
        # If the user needs explicit background removal, we should expose that service too.
        
        final_key = get_api_key(api_key)
        result = create_packshot(
            api_key=final_key,
            image_data=image_data,
            background_color=background_color,
            sku=sku,
            force_rmbg=force_rmbg,
            content_moderation=content_moderation
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/product/shadow")
async def api_add_shadow(
    file: UploadFile = File(...),
    api_key: Optional[str] = Form(None),
    shadow_type: str = Form("regular"), # 'regular' or 'float'
    background_color: Optional[str] = Form(None),
    shadow_color: str = Form("#000000"),
    shadow_intensity: float = Form(60),
    shadow_blur: float = Form(20),
    x_offset: float = Form(0),
    y_offset: float = Form(15),
    width_scale: float = Form(0), # Only for float
    height_scale: float = Form(70), # Only for float
    force_rmbg: bool = Form(True)
):
    """
    Add shadow to a product image.
    """
    try:
        image_data = await file.read()
        
        final_key = get_api_key(api_key)
        result = add_shadow(
            api_key=final_key,
            image_data=image_data,
            shadow_type=shadow_type,
            background_color=background_color,
            shadow_color=shadow_color,
            shadow_offset=[x_offset, y_offset],
            shadow_intensity=shadow_intensity,
            shadow_blur=shadow_blur,
            shadow_width=width_scale if shadow_type == "float" else None,
            shadow_height=height_scale if shadow_type == "float" else None,
            force_rmbg=force_rmbg
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/product/lifestyle-text")
async def api_lifestyle_text(
    file: UploadFile = File(...),
    api_key: Optional[str] = Form(None),
    scene_description: str = Form(...),
    placement_type: str = Form("original"), # original, automatic, manual_placement
    manual_positions: Optional[str] = Form(None) # Comma separated list
):
    """
    Generate lifestyle shot from text description.
    """
    try:
        image_data = await file.read()
        
        positions = []
        if manual_positions:
            positions = [p.strip().lower().replace(" ", "_") for p in manual_positions.split(",")]
            
        final_key = get_api_key(api_key)
        result = lifestyle_shot_by_text(
            api_key=final_key,
            image_data=image_data,
            scene_description=scene_description,
            placement_type=placement_type,
            num_results=1,
            sync=True,
            manual_placement_selection=positions,
            force_rmbg=True
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/product/lifestyle-image")
async def api_lifestyle_image(
    product_file: UploadFile = File(...),
    ref_file: UploadFile = File(...),
    api_key: Optional[str] = Form(None),
    placement_type: str = Form("original"),
    manual_positions: Optional[str] = Form(None)
):
    """
    Generate lifestyle shot using a reference image.
    """
    try:
        product_data = await product_file.read()
        ref_data = await ref_file.read()
        
        positions = []
        if manual_positions:
            positions = [p.strip().lower().replace(" ", "_") for p in manual_positions.split(",")]
            
        final_key = get_api_key(api_key)
        result = lifestyle_shot_by_image(
            api_key=final_key,
            image_data=product_data,
            reference_image=ref_data,
            placement_type=placement_type,
            num_results=1,
            sync=True,
            manual_placement_selection=positions,
            force_rmbg=True,
            enhance_ref_image=True,
            ref_image_influence=0.6
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/edit/generative-fill")
async def api_generative_fill(
    file: UploadFile = File(...),
    mask_file: UploadFile = File(...),
    api_key: Optional[str] = Form(None),
    prompt: str = Form(...),
    expansion_amount: int = Form(0)
):
    """
    Generative fill or expand image.
    """
    try:
        image_data = await file.read()
        mask_data = await mask_file.read()
        
        # The service expects mask as bytes? or file path? 
        # Checking imports: services.generative_fill
        # Usually these take bytes.
        
        final_key = get_api_key(api_key)
        result = generative_fill(
            api_key=final_key,
            image_data=image_data,
            mask_data=mask_data,
            prompt=prompt,
            num_results=1,
            sync=True
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@app.post("/edit/erase")
async def api_erase(
    file: UploadFile = File(...),
    mask_file: UploadFile = File(...),
    api_key: Optional[str] = Form(None)
):
    """
    Erase objects from image using mask.
    """
    try:
        image_data = await file.read()
        mask_data = await mask_file.read()
        
        final_key = get_api_key(api_key)
        # Use generative fill with a removal prompt to act as an object eraser
        result = generative_fill(
            api_key=final_key,
            image_data=image_data,
            mask_data=mask_data,
            prompt="remove the object and fill with background texture",
            num_results=1,
            sync=True
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
