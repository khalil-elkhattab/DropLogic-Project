import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from gtts import gTTS

# إعداد الـ Router البرمجي الموحد للمنصة
router = APIRouter(prefix="/api/video-baker", tags=["Video Baker Engine"])

# الهيكل القياسي لاستقبال طلبات الطبخ من الواجهات المستعلمة
class BakeRequest(BaseModel):
    product_name: str
    video_url: str
    final_hook: str
    final_body: str
    final_cta: str
    selected_voice: str
    selected_bg_music: str
    watermark_attached: bool
    logo_url: Optional[str] = None

@router.post("/bake")
async def bake_final_video(payload: BakeRequest):
    try:
        # 1️⃣ استدعاء المتغيرات البيئية والمفاتيح الحيوية للنظام
        shotstack_key = os.getenv("SHOTSTACK_KEY", "oSkl2izXxKvGdgbdxde5iI6wFhh8SE1jA9UYySyq")
        server_public_url = os.getenv("SERVER_PUBLIC_URL", "https://joya-denary-destructively.ngrok-free.dev")
        
        # تنظيف مسارات الخادم العام الممرر من أي شوائب إملائية في النهاية
        server_public_url = server_public_url.rstrip('/')

        # 2️⃣ هندسة وتوليد الملف الصوتي للمنتج محلياً
        os.makedirs("static/audio", exist_ok=True)
        unique_id = os.urandom(4).hex()
        voice_filename = f"voice_{unique_id}.mp3"
        voice_audio_path = f"static/audio/{voice_filename}"
        
        # دمج عناصر السيناريو الثلاثة لبناء الهيكل النصي الموحد للتعليق الصوتي
        full_ad_text = f"{payload.final_hook}. {payload.final_body}. {payload.final_cta}"
        
        print("[+] Generating VoiceOver locally via Neural engine...")
        tts = gTTS(text=full_ad_text, lang='en', tld='com')
        tts.save(voice_audio_path)

        # 3️⃣ استخراج الرابط العام لملف الصوت وحقنه لتخطي حواجز النفق الاستضافي
        public_audio_url = f"{server_public_url}/static/audio/{voice_filename}"
        print(f"[+] Public Audio URL configured for Cloud ingestion: {public_audio_url}")

        # 4️⃣ بناء الهيكل السحابي المحدث والمطابق لمقاييس التوثيق الرسمية لـ Shotstack
        shotstack_url = "https://api.shotstack.io/stage/render"
        
        headers = {
            "x-api-key": shotstack_key,
            "Content-Type": "application/json"
        }

        # الـ Payload البرمجي السليم والخالي من الخصائص المجهولة أو الجودات غير المدعومة
        timeline_payload = {
            "timeline": {
                "tracks": [
                    {
                        "clips": [
                            {
                                "asset": {
                                    "type": "video",
                                    "src": payload.video_url,
                                    "volume": 0  # كتم الصوت الأصلي للفيديو لمنع التداخل
                                },
                                "start": 0,
                                "length": 15,
                                "effect": "zoomIn"  # تم التصحيح للمفرد لإزالة خطأ unknown property
                            }
                        ]
                    },
                    {
                        "clips": [
                            {
                                "asset": {
                                    "type": "audio",
                                    "src": public_audio_url,
                                    # حقن الـ Header الاستثنائي للسماح لخوادم AWS بتجاوز صفحة ngrok التحذيرية
                                    "extraHeaders": {
                                        "ngrok-skip-browser-warning": "true"
                                    }
                                },
                                "start": 0,
                                "length": 15
                            }
                        ]
                    }
                ]
            },
            "output": {
                "format": "mp4",
                "resolution": "preview"  # تم التصحيح إلى خيار معتمد ورسمي لبيئات الـ Stage والتطوير السريع
            }
        }

        print("[+] Forwarding payload safely to Shotstack Cloud Gateway...")
        response = requests.post(shotstack_url, json=timeline_payload, headers=headers)
        
        if response.status_code not in [200, 201]:
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"Cloud Rendering gateway rejected payload: {response.text}"
            )
        
        shotstack_data = response.json()
        render_id = shotstack_data.get("response", {}).get("id")

        return {
            "success": True,
            "message": "Baking pipeline offloaded to cloud successfully. Concurrency safe.",
            "render_id": render_id,
            "check_status_url": f"{server_public_url}/api/video-baker/render-status/{render_id}",
            "marketing_assets": {
                "video_caption": f"{payload.final_hook} 🔥 {payload.final_body} ⏳ {payload.final_cta}"
            }
        }

    except Exception as e:
        print("[-] Enterprise Cloud Pipeline Failed:", str(e))
        raise HTTPException(status_code=500, detail=f"Baking pipeline failed: {str(e)}")


@router.get("/render-status/{render_id}")
async def get_render_status(render_id: str):
    try:
        shotstack_key = os.getenv("SHOTSTACK_KEY", "oSkl2izXxKvGdgbdxde5iI6wFhh8SE1jA9UYySyq")
        url = f"https://api.shotstack.io/stage/render/{render_id}"
        headers = {"x-api-key": shotstack_key}
        
        response = requests.get(url, headers=headers)
        data = response.json()
        
        status = data.get("response", {}).get("status")
        video_url = data.get("response", {}).get("url")
        
        return {
            "render_id": render_id,
            "status": status,
            "final_video_url": video_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status fetching failed: {str(e)}")