import os
import random
import json
import httpx
import re
import asyncio
import time
import logging
import traceback
from fastapi import BackgroundTasks, FastAPI, HTTPException, Query, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from typing import Optional
from groq import Groq

# 1. Load environment variables from .env file
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("droplogic")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Import media asset scraper module
try:
    from scrapper import fetch_all_platforms_assets
except ImportError:
    # Fallback function to safeguard local server testing
    async def fetch_all_platforms_assets(clean_input): return [], ""

# 🟢 STRICT AUDIO ENGINE IMPORT (No more hidden fallbacks / No more warnings)
from audio_processor import generate_voice_over, mix_voice_and_background
from usage_quota import QuotaExceededError, enforce_bake_quota, record_successful_bake
from cleanup_assets import cleanup_bake_temp_assets
from ad_history import fetch_generated_ads, save_generated_ad
from product_insights import build_active_competitors, build_financials, build_sales_trend
from url_utils import sanitize_asset_video_url, sanitize_download_url
from cloud_render import CloudRenderError, download_rendered_video, fetch_cloud_render_status, render_with_failover

app = FastAPI(
    title="DropLogic Neural Content Pipeline (Local Server Edition)",
    description="Integrated backend engine executing cloud video baking via Json2Video and Renderform.",
    version="4.2.0"
)


CORS_ALLOWED_ORIGINS = [
    "https://www.droplogicai.com",
    "https://droplogicai.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# 🛠️ تحديد المسارات المطلقة لضمان ثبات الملفات على سيرفرات Linux
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
OUTPUTS_DIR = os.path.join(STATIC_DIR, "outputs")

# إنشاء المجلدات إذا لم تكن موجودة
os.makedirs(OUTPUTS_DIR, exist_ok=True)

# ربط المجلد الاستاتيكي باستخدام المسار المطلق الشامل
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Runtime storage for system caching and tracking local rendering jobs
COMPUTED_CACHE = {}
RENDER_JOBS = {}  

# Server deployment target public URL mapping (strip mistaken /api suffix)
SERVER_PUBLIC_URL = (os.getenv("SERVER_PUBLIC_URL", "http://164.90.235.14:8000") or "").rstrip("/")
if SERVER_PUBLIC_URL.endswith("/api"):
    SERVER_PUBLIC_URL = SERVER_PUBLIC_URL[:-4]
# Securely initialize the Groq client instance
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

class ProductRequest(BaseModel):
    keyword: Optional[str] = None
    target_input: Optional[str] = None

class StudioScriptRequest(BaseModel):
    product_name: str
    angle: str           
    video_url: str = "" 

# Main parameters structure maintained strictly for flawless Frontend integration compatibility
class VideoBakeRequest(BaseModel):
    product_name: str         
    video_url: str            
    final_hook: str           
    final_body: str           
    final_cta: str            
    selected_voice: str       
    selected_bg_music: str    
    watermark_attached: bool  
    logo_url: Optional[str] = None 
    
    video_duration: Optional[float] = 15.0        
    video_scale: Optional[float] = 0.9            
    camera_effect: Optional[str] = "zoomIn"       
    bg_camera_effect: Optional[str] = "zoomInSlow" 
    audio_volume: Optional[float] = 1.0
    anti_ban_filter: bool = False
    burn_captions: bool = True
    clerk_user_id: Optional[str] = None
    email: Optional[str] = None


def analyze_text_with_real_ai(live_scraped_text: str, keyword: str) -> dict:
    logic_score = random.randint(80, 95)
    sentiment_score = random.randint(70, 92)
    saturation_score = random.randint(25, 60)
    net_margin = random.randint(20, 45)
    
    store_keyword = keyword.replace(" ", "").lower()
    
    return {
        "logic_score": str(logic_score / 10), 
        "sentiment": f"{sentiment_score}%", 
        "saturation": "Medium" if saturation_score < 50 else "High", 
        "net_margin": f"{net_margin}%",
        "competitors": [
            {
                "domain": f"{store_keyword}trends.com", 
                "price": f"${random.randint(19, 49)}.99", 
                "spend": "Medium", 
                "color": "text-amber-500", 
                "story": f"Active Shopify competitor testing {keyword} traffic scaling."
            },
            {
                "domain": f"shop{store_keyword}.com", 
                "price": f"${random.randint(24, 59)}.95", 
                "spend": "High", 
                "color": "text-emerald-500", 
                "story": "Viral dropshipping store driving active TikTok ad campaigns."
            }
        ],
        "phrases": [
            f"Highly demanded {keyword} item on global market feeds right now.",
            "Fast free worldwide shipping available today only.",
            "This viral video hook is pulling massive social engagement rates."
        ]
    }


def clean_and_parse_json(raw_text: str) -> dict:
    """Extract and parse JSON from LLM output; return {} instead of crashing."""
    if not raw_text or not str(raw_text).strip():
        logger.warning("AI returned empty content — using script fallbacks")
        return {}

    candidate = str(raw_text).strip()
    match = re.search(r"\{.*\}", candidate, re.DOTALL)
    if match:
        candidate = match.group(0)

    try:
        parsed = json.loads(candidate)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError as exc:
        logger.warning("Failed to parse AI JSON output: %s | snippet=%r", exc, candidate[:200])
        return {}


def normalize_script_layers(script_layers: dict, product_name: str) -> dict:
    """Normalize LLM output into hook_options (3), body, and cta."""
    product_name = product_name or "this product"
    default_hooks = [
        f"Stop scrolling — this {product_name} changes everything.",
        f"Nobody talks about this {product_name} hack.",
        f"I wish I found this {product_name} sooner.",
    ]

    hook_options = script_layers.get("hook_options")
    if isinstance(hook_options, list) and hook_options:
        hooks = [str(hook).strip() for hook in hook_options if str(hook).strip()]
        while len(hooks) < 3:
            hooks.append(hooks[-1] if hooks else default_hooks[len(hooks)])
        hooks = hooks[:3]
    else:
        single_hook = str(script_layers.get("hook", default_hooks[0])).strip() or default_hooks[0]
        hooks = [
            single_hook,
            f"POV: you finally found the perfect {product_name}.",
            f"This is why everyone is buying {product_name} right now.",
        ]

    body = str(script_layers.get("body", "")).strip() or (
        f"This viral {product_name} solves your biggest daily pain points instantly. "
        "Premium quality without the premium markup."
    )
    cta = str(script_layers.get("cta", "")).strip() or (
        f"Get 50% off {product_name} today only — tap the link in bio before we sell out."
    )

    return {
        "hook_options": hooks,
        "body": body,
        "cta": cta,
    }


def build_script_engine_response(product_name: str, video_url: str, angle: str, script_layers: dict) -> dict:
    normalized = normalize_script_layers(script_layers, product_name)
    return {
        "success": True,
        "product_name": product_name,
        "video_url": video_url,
        "script_engine": {
            "selected_angle": angle,
            "hook_options": normalized["hook_options"],
            "hook": normalized["hook_options"][0],
            "body": normalized["body"],
            "cta": normalized["cta"],
        },
    }


# ----------------------------------------------------------------------
# 1. Product Mining Engine
# ----------------------------------------------------------------------
@app.post("/api/run-analysis", summary="Analyze product and extract live media assets")
async def analyze_pipeline(request: ProductRequest):
    raw_input = request.keyword or request.target_input
    
    if not raw_input:
        raise HTTPException(status_code=400, detail="Input field ('keyword' or 'target_input') cannot be empty")
    
    clean_input = raw_input.strip().lower()
    
    if clean_input in COMPUTED_CACHE:
        print(f"[⚡ GLOBAL CACHE HIT] Serving instant response payload for: {clean_input}")
        cached = dict(COMPUTED_CACHE[clean_input])
        cached_assets = []
        for asset in cached.get("raw_assets") or []:
            if not isinstance(asset, dict):
                continue
            cleaned = dict(asset)
            safe_video = sanitize_asset_video_url(str(cleaned.get("video_url") or ""))
            if safe_video:
                cleaned["video_url"] = safe_video
                cached_assets.append(cleaned)
        cached["raw_assets"] = cached_assets
        return cached
        
    print(f"\n[🚀 ASYNC EXECUTION] Processing live cross-platform mining for: {clean_input}")
    
    try:
        video_assets, live_scraped_text = await fetch_all_platforms_assets(clean_input)
    except Exception as e:
        print(f"[-] Error parsing platform assets: {e}")
        video_assets = []
        live_scraped_text = ""

    try:
        real_ai_results = analyze_text_with_real_ai(live_scraped_text, clean_input)
        if not isinstance(real_ai_results, dict):
            raise ValueError("AI Engine did not return a valid dictionary structure")
    except Exception as e:
        print(f"[-] AI Engine analytical error: {e}")
        real_ai_results = {
            "logic_score": "8.5", 
            "sentiment": "78%", 
            "saturation": "Medium", 
            "net_margin": "35%",
            "competitors": [{"domain": "globaltrendshop.com", "price": "$29.99", "spend": "Medium", "color": "text-amber-500", "story": "Active store tracking."}],
            "phrases": ["Highly demanded item on global market feeds right now."]
        }

    financials = build_financials(clean_input)
    sales_trend = build_sales_trend()
    active_competitors = build_active_competitors(clean_input)

    sanitized_assets = []
    for asset in video_assets:
        if not isinstance(asset, dict):
            continue
        cleaned = dict(asset)
        raw_video = cleaned.get("video_url") or cleaned.get("videoUrl") or ""
        safe_video = sanitize_asset_video_url(str(raw_video))
        if not safe_video:
            logger.warning("Dropping analysis asset with invalid video_url: %r", raw_video)
            continue
        cleaned["video_url"] = safe_video
        sanitized_assets.append(cleaned)

    response_payload = {
        "analysis_id": f"DL-{random.randint(7000, 9999)}-X",
        "product_name": clean_input,
        "metrics": {
            "logic_score": real_ai_results.get("logic_score", "8.5"),
            "sentiment": real_ai_results.get("sentiment", "78%"),
            "saturation": real_ai_results.get("saturation", "Medium"),
            "net_margin": f"{financials['net_profit_margin_pct']:.1f}%",
        },
        "financials": financials,
        "sales_trend": sales_trend,
        "active_competitors": active_competitors,
        "intercepted_stores": active_competitors or real_ai_results.get("competitors", []),
        "audience_phrases": real_ai_results.get("phrases", ["No trends returned from engine pipeline yet."]),
        "raw_assets": sanitized_assets,
    }
    
    COMPUTED_CACHE[clean_input] = response_payload
    return response_payload


# ----------------------------------------------------------------------
# 2. Hybrid Groq & OpenRouter Script Studio Engine
# ----------------------------------------------------------------------
video_studio_router = APIRouter(prefix="/api/video-studio", tags=["Video Studio"])

@video_studio_router.post("/generate", summary="Generate script layers via Groq or OpenRouter")
async def generate_ai_script_layers(request: StudioScriptRequest):
    if not request.product_name:
        raise HTTPException(status_code=400, detail="Product name cannot be empty")
        
    clean_angle = request.angle.strip().lower()
    print(f"\n[🧠 AI ENGINE] Spawning generation worker for: {request.product_name} | Angle: {clean_angle}")
    
    base_instructions = f"""
    You are a professional TikTok and Meta e-commerce copywriter for Western dropshippers.
    Create a high-converting English ad script for the product: "{request.product_name}".

    You MUST output ONLY a valid JSON object with exactly these keys:
    - "hook_options": an array of exactly 3 distinct strings. Each hook must be punchy, spoken in first person,
      under 14 words, and engineered to grab attention in the FIRST 3 SECONDS on TikTok. No numbering or bullets inside strings.
    - "body": a string with 2-3 short sentences covering the main product benefits, transformation, and social proof.
    - "cta": a string with a strong conversion closer including urgency (example pattern: "Get 50% off today only at the link in bio").

    Do not include any introduction, markdown formatting, backticks, or text outside the JSON block.
    """

    if "problem" in clean_angle or "solve" in clean_angle:
        angle_prompt = f"{base_instructions}\nAngle: Problem-Solving.\nHooks should expose a painful problem then tease transformation.\nBody should explain the solution.\nCTA should drive immediate purchase."
    elif "viral" in clean_angle or "tiktok" in clean_angle:
        angle_prompt = (
            f"{base_instructions}\n"
            "Angle: TikTok Viral Style.\n"
            'Hooks should feel organic, like "TikTok made me buy it" energy.\n'
            "Body should use social proof.\n"
            "CTA should create FOMO."
        )
    elif "urgency" in clean_angle or "fomo" in clean_angle:
        angle_prompt = f"{base_instructions}\nAngle: Urgency / Price Drop.\nHooks should flash scarcity or warehouse clearing.\nBody should intensify the sale.\nCTA must include a deadline."
    elif "ugc" in clean_angle:
        angle_prompt = f"{base_instructions}\nAngle: User Generated Content (UGC).\nHooks should sound like authentic native reactions.\nBody should list practical everyday benefits.\nCTA should point to shop link."
    else:
        angle_prompt = f"{base_instructions}\nAngle: Pure Organic Content.\nHooks should feel behind-the-scenes or discovery-style.\nBody should focus on aesthetic and utility.\nCTA should be soft but direct."

    if groq_client:
        try:
            print("[⚡ GROQ WORKER] Dispatching request to Llama 3.3 Versatile on Groq...")
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",  
                messages=[{"role": "user", "content": angle_prompt}],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            raw_content = completion.choices[0].message.content.strip()
            script_layers = clean_and_parse_json(raw_content)
            return build_script_engine_response(
                request.product_name,
                request.video_url,
                request.angle,
                script_layers,
            )
        except Exception as groq_err:
            logger.warning("Groq script generation failed, trying OpenRouter: %s", groq_err)
            logger.debug(traceback.format_exc())

    if OPENROUTER_API_KEY:
        try:
            print("[🌐 OPENROUTER WORKER] Dispatching fallback request to Gemma 2...")
            openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "DropLogic Engine"
            }
            payload = {
                "model": "google/gemma-2-9b-it:free",
                "messages": [{"role": "user", "content": angle_prompt}]
            }
            async with httpx.AsyncClient() as client:
                response = await client.post(openrouter_url, headers=headers, json=payload, timeout=25.0)
                if response.status_code == 200:
                    ai_response_data = response.json()
                    raw_ai_json_text = ai_response_data['choices'][0]['message']['content'].strip()
                    script_layers = clean_and_parse_json(raw_ai_json_text)
                    return build_script_engine_response(
                        request.product_name,
                        request.video_url,
                        request.angle,
                        script_layers,
                    )
        except Exception as or_err:
            logger.warning("OpenRouter script generation failed, using defaults: %s", or_err)
            logger.debug(traceback.format_exc())

    return build_script_engine_response(
        request.product_name,
        request.video_url,
        request.angle,
        {},
    )


# ----------------------------------------------------------------------
# 📌 Cloud Bake Engine (Json2Video primary, Renderform failover)
# ----------------------------------------------------------------------
@video_studio_router.get("/usage", summary="Return current video bake quota for a signed-in user")
async def get_video_usage_quota(clerk_user_id: str = Query(...), email: Optional[str] = Query(None)):
    try:
        from usage_quota import evaluate_quota

        status = await evaluate_quota(clerk_user_id, email)
        remaining = max(status.limit - status.used, 0)
        return {
            "success": True,
            "plan_status": status.plan_status,
            "limit": status.limit,
            "used": status.used,
            "remaining": remaining,
            "allowed": status.allowed,
            "period": status.period,
            "message": status.message,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to fetch usage quota: {exc}") from exc


@video_studio_router.post("/bake", summary="Bake marketing assets via Json2Video / Renderform cloud pipeline")
async def start_video_baking_pipeline(
    request: VideoBakeRequest,
    background_tasks: BackgroundTasks,
):
    if not request.video_url:
        raise HTTPException(status_code=400, detail="Target raw video source URL cannot be empty.")

    try:
        quota_status = await enforce_bake_quota(request.clerk_user_id, request.email)
        print(
            f"[📊 QUOTA] User {request.clerk_user_id} | plan={quota_status.plan_status} "
            f"| used={quota_status.used}/{quota_status.limit} ({quota_status.period})"
        )
    except QuotaExceededError as quota_err:
        status = quota_err.status
        raise HTTPException(
            status_code=403,
            detail={
                "code": "quota_exceeded",
                "message": status.message,
                "plan_status": status.plan_status,
                "limit": status.limit,
                "used": status.used,
                "period": status.period,
            },
        ) from quota_err

    temp_cleanup_paths: list[str] = []
    output_video_path = ""

    try:
        unique_id = os.urandom(4).hex()
        print(f"\n[🚀 CLOUD BAKE START] Initializing Json2Video / Renderform pipeline for: {request.product_name}")

        try:
            source_video_url = sanitize_download_url(
                request.video_url,
                backend_public_url=SERVER_PUBLIC_URL,
            )
        except ValueError as url_err:
            raise HTTPException(status_code=400, detail=str(url_err)) from url_err

        print(f"[🔗 SOURCE VIDEO] {source_video_url[:160]}...")

        full_custom_script = f"{request.final_hook} {request.final_body} {request.final_cta}"
        print("[🎙️ AI SYNTHESIS] Generating voice over via internal engine...")
        temp_voice_file = generate_voice_over(full_custom_script, request.selected_voice)
        temp_cleanup_paths.append(temp_voice_file)

        print("[🎵 AUDIO MIXER] Merging voice over with background music tracks...")
        mix_voice_and_background(
            voice_path=temp_voice_file,
            bg_music_type=request.selected_bg_music,
            output_filename=f"mix_{unique_id}",
        )

        final_audio_path = os.path.join(OUTPUTS_DIR, f"mix_{unique_id}.wav")
        temp_cleanup_paths.append(final_audio_path)
        public_audio_url = f"{SERVER_PUBLIC_URL}/static/outputs/mix_{unique_id}.wav"

        output_video_filename = f"final_video_{unique_id}.mp4"
        output_video_path = os.path.join(OUTPUTS_DIR, output_video_filename)
        target_duration = float(request.video_duration or 15.0)

        print("[☁️ CLOUD RENDER] Submitting to Json2Video with Renderform failover...")
        cloud_job = await asyncio.to_thread(
            render_with_failover,
            video_url=source_video_url,
            audio_url=public_audio_url,
            product_name=request.product_name,
            duration=target_duration,
        )

        job_id = cloud_job.combined_id
        RENDER_JOBS[job_id] = {"status": "rendering", "file_path": output_video_path, "provider": cloud_job.provider}

        print(f"[📥 CLOUD DOWNLOAD] Persisting rendered asset from {cloud_job.provider}...")
        await download_rendered_video(cloud_job.final_video_url, output_video_path)

        RENDER_JOBS[job_id] = {"status": "done", "file_path": output_video_path, "provider": cloud_job.provider}
        final_video_url = f"{SERVER_PUBLIC_URL}/static/outputs/{output_video_filename}"

        if request.clerk_user_id:
            await record_successful_bake(
                request.clerk_user_id,
                request.email,
                job_id,
                request.product_name,
            )
            try:
                await save_generated_ad(
                    user_id=request.clerk_user_id,
                    product_name=request.product_name,
                    selected_hook=request.final_hook,
                    video_url=final_video_url,
                )
                print(f"[📚 AD HISTORY] Saved generated ad for user {request.clerk_user_id}")
            except Exception as history_err:
                print(f"[⚠️ AD HISTORY] Failed to persist ad record: {history_err}")

        clean_tags = request.product_name.replace(" ", "").lower()
        
        print(f"[🚀 CONNECTION RELEASED] Video is 100% baked and ready on storage. Responding to Frontend.")

        background_tasks.add_task(
            cleanup_bake_temp_assets,
            temp_cleanup_paths,
            job_id,
            preserve_paths=[output_video_path],
        )

        return {
            "success": True,
            "message": f"Cloud render completed via {cloud_job.provider} with automatic failover support.",
            "render_id": job_id,
            "provider": cloud_job.provider,
            "final_video_url": final_video_url,
            "check_status_url": f"{SERVER_PUBLIC_URL}/api/video-studio/render-status/{job_id}",
            "marketing_assets": {
                "video_caption": f"{request.final_hook} 🤫✨",
                "primary_ad_copy": f"Stop scrolling! 🚨 Viral {request.product_name} completely flips your setup upside down. Get 50% OFF tonight only. Free Worldwide Shipping included! {request.final_cta}",
                "trending_hashtags": f"#dropshipping #viralproduct #tiktokmademebuyit #amazonfinds #{clean_tags} #ecommerce"
            }
        }

    except HTTPException:
        background_tasks.add_task(
            cleanup_bake_temp_assets,
            temp_cleanup_paths,
            job_id if "job_id" in locals() else "",
        )
        raise
    except CloudRenderError as cloud_err:
        print(f"[🚨 CLOUD RENDER ERROR]: {cloud_err}")
        background_tasks.add_task(
            cleanup_bake_temp_assets,
            temp_cleanup_paths,
            job_id if "job_id" in locals() else "",
        )
        raise HTTPException(status_code=502, detail=str(cloud_err)) from cloud_err
    except Exception as e:
        print(f"[🚨 PIPELINE ERROR]: {str(e)}")
        background_tasks.add_task(
            cleanup_bake_temp_assets,
            temp_cleanup_paths,
            job_id if "job_id" in locals() else "",
        )
        raise HTTPException(status_code=500, detail=f"Internal Baking pipeline failed: {str(e)}") from e


# ----------------------------------------------------------------------
# 📌 Local Rendering Task Tracking Hub
# ----------------------------------------------------------------------
@video_studio_router.get("/render-status/{render_id}", summary="Fetch final cloud video asset link once processing finishes")
async def get_render_status(render_id: str):
    if render_id.startswith(("json2video_", "renderform_")):
        try:
            return await asyncio.to_thread(fetch_cloud_render_status, render_id)
        except CloudRenderError as exc:
            return {
                "render_id": render_id,
                "status": "failed",
                "final_video_url": None,
                "error": str(exc),
            }

    if render_id not in RENDER_JOBS:
        return {"render_id": render_id, "status": "rendering", "final_video_url": None}

    job_info = RENDER_JOBS[render_id]
    
    if job_info["status"] == "done":
        filename = os.path.basename(job_info["file_path"])
        
        # 🟢 تأمين إضافي دقيق: التحقق من وجود الملف الفعلي وحجمه قبل تسليم الرابط
        full_file_path = os.path.join(OUTPUTS_DIR, filename)
        if os.path.exists(full_file_path) and os.path.getsize(full_file_path) > 100 * 1024:
            final_url = f"{SERVER_PUBLIC_URL}/static/outputs/{filename}"
            return {"render_id": render_id, "status": "done", "final_video_url": final_url}
        else:
            return {"render_id": render_id, "status": "rendering", "final_video_url": None}
            
    elif job_info["status"] == "failed":
        return {
            "render_id": render_id,
            "status": "failed",
            "error": job_info.get("error", "Unknown cloud render error")
        }
    else:
        return {
            "render_id": render_id,
            "status": "rendering",
            "final_video_url": None
        }


# ----------------------------------------------------------------------
# 📌 Master Audio Asset Streaming/Download Station
# ----------------------------------------------------------------------
@video_studio_router.get("/download-audio/{filename}", summary="Download and listen to the final baked audio clip")
async def download_baked_audio(filename: str):
    clean_filename = os.path.basename(filename)
    file_path = os.path.join(OUTPUTS_DIR, clean_filename)
    
    # 🟢 فحص لحماية التحميل من الملفات التالفة أو الفارغة صفر بايت
    if os.path.exists(file_path) and os.path.getsize(file_path) > 10 * 1024:
        ext = os.path.splitext(clean_filename)[1].lower()
        media_type = "audio/wav" if ext == ".wav" else "audio/mp3"
        return FileResponse(file_path, media_type=media_type, filename=clean_filename)
    raise HTTPException(status_code=404, detail="Audio file not found or still processing")


# ----------------------------------------------------------------------
# 📌 Generated Ad History API
# ----------------------------------------------------------------------
ads_router = APIRouter(prefix="/api/ads", tags=["Ad History"])


@ads_router.get("/history", summary="Fetch generated ads for a specific user")
async def get_user_ad_history(user_id: str = Query(..., description="Clerk user ID")):
    if not user_id.strip():
        raise HTTPException(status_code=400, detail="user_id is required")

    try:
        ads = await fetch_generated_ads(user_id.strip())
        return {"success": True, "ads": ads}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to load ad history: {exc}") from exc


# Initialize global router components
app.include_router(video_studio_router)
app.include_router(ads_router)


# ----------------------------------------------------------------------
# 3. Video Proxy Stream Engine (CORS / Hotlinking Bypass)
# ----------------------------------------------------------------------
@app.get("/api/proxy-video", summary="Stream external videos safely via Backend to bypass CORS / Hotlinking restrictions")
async def proxy_video(url: str = Query(..., description="The raw external video source URL")):
    try:
        safe_url = sanitize_download_url(url, backend_public_url=SERVER_PUBLIC_URL)
    except ValueError as url_err:
        logger.warning("Proxy rejected invalid URL %r: %s", url, url_err)
        raise HTTPException(status_code=400, detail=str(url_err)) from url_err

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Encoding": "identity;q=1, *;q=0",
        "Referer": "https://www.tiktok.com/",
        "Connection": "keep-alive"
    }

    async def video_chunk_generator():
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                async with client.stream("GET", safe_url, headers=headers, timeout=25.0) as response:
                    if response.status_code in [200, 206]:
                        async for chunk in response.aiter_bytes(chunk_size=1024 * 64):
                            yield chunk
                    else:
                        print(f"[-] CDN rejected proxy request with status: {response.status_code}")
                        yield b""
            except Exception as stream_err:
                print(f"[-] Exception while streaming video chunks: {stream_err}")
                yield b""

    return StreamingResponse(
        video_chunk_generator(),
        media_type="video/mp4",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Accept-Ranges": "bytes"
        }
    )


# ----------------------------------------------------------------------
# 🌐 Direct Main App Endpoints (نسخة ذكية ومحكمة تمنع إظهار الروابط أثناء فترة التعديل)
# ----------------------------------------------------------------------
@video_studio_router.get("/published-assets")
@app.get("/api/video-studio/published-assets")
@app.get("/published-assets")
async def get_all_published_assets_safe():
    if not os.path.exists(OUTPUTS_DIR):
        return {"success": True, "videos": []}
        
    video_files = [f for f in os.listdir(OUTPUTS_DIR) if f.endswith('.mp4') and not f.startswith('temp_download_')]
    
    assets = []
    for filename in video_files:
        video_path = os.path.join(OUTPUTS_DIR, filename)
        
        if os.path.exists(video_path):
            file_size = os.path.getsize(video_path)
            time_since_mod = time.time() - os.path.getmtime(video_path)
            
            # 🟢 الفحص الاحترافي الفائق: التأكد من تخطي الحجم المبدئي وأن التعديل توقف منذ ثانيتين على الأقل
            if file_size > 100 * 1024 and time_since_mod > 2:
                unique_id = filename.replace("final_video_", "").replace(".mp4", "")
                corresponding_audio = f"mix_{unique_id}.wav"
                audio_path = os.path.join(OUTPUTS_DIR, corresponding_audio)
                
                has_valid_audio = os.path.exists(audio_path) and os.path.getsize(audio_path) > 10 * 1024
                
                assets.append({
                    "video_url": f"{SERVER_PUBLIC_URL}/static/outputs/{filename}",
                    "audio_url": f"{SERVER_PUBLIC_URL}/static/outputs/{corresponding_audio}" if has_valid_audio else None,
                    "filename": filename,
                    "timestamp": os.path.getmtime(video_path)
                })
            
    # ترتيب تصاعدي من الأحدث للأقدم
    assets.sort(key=lambda x: x['timestamp'], reverse=True)
    
    for asset in assets:
        asset.pop('timestamp', None)
        
    return {"success": True, "videos": assets}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)