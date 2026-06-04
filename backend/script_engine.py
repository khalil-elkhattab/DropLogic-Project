import os
from groq import Groq
from dotenv import load_dotenv

# شحن مفاتيح البيئة
load_dotenv()

# تهيئة عميل Groq باستخدام المفتاح الجديد المستدعى من الـ .env
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

def generate_marketing_script(product_name: str, angle: str) -> dict:
    """
    محرك توليد النصوص الذكي المعتمد على Groq Llama 3.3 70B
    يستقبل طلبات الاستوديو ويصيغ الـ Script بدقة خرافية وسرعة فائقة.
    """
    if not GROQ_API_KEY:
        print("[-] Warning: GROQ_API_KEY is missing from .env")
        return {
            "hook": "Stop scrolling! 🚨",
            "body": f"This viral {product_name} completely transformed my late-night setup.",
            "cta": "Get 50% off tonight only. Click shop now!"
        }

    # تحديد طبيعة الزاوية التسويقية المطلوبة
    angle_prompts = {
        "problem_solving": "Focus heavily on a frustrating daily pain point and position this product as the ultimate solution/transformation.",
        "tiktok_viral": "Use high social proof, organic 'TikTok made me buy it' style energy, FOMO, and trending e-com words.",
        "urgency": "Create extreme scarcity. Focus on warehouse inventory clearing out, price drops, and tonight only offers."
    }
    
    strategy = angle_prompts.get(angle, angle_prompts["problem_solving"])
    
    system_prompt = (
        "You are an expert E-commerce Video Ad Copywriter for TikTok & Reels.\n"
        "Your job is to write a high-converting short script based on the product name and strategy.\n"
        "CRITICAL: You must return the output EXACTLY in the following format. No conversational text, no intro, no outro, just the blocks:\n\n"
        "HOOK:\n[Insert punchy attention grabber]\n\n"
        "BODY:\n[Insert core benefits and value proposition]\n\n"
        "CTA:\n[Insert strong call to action]"
    )
    
    user_content = f"Product: {product_name}\nStrategy: {strategy}\nGenerate the script now."

    try:
        # استدعاء أحدث نموذج سريع وذكي متوفر في لوحة التحكم الخاصة بك
        completion = client.chat.completions.create(
            model="llama3-70b-8192", 
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.7,
            max_tokens=400
        )
        
        response_text = completion.choices[0].message.content
        
        # تفكيك النص المستلم ليعود كـ Object مهيكل وجاهز للفرونت إند
        hook, body, cta = "", "", ""
        sections = response_text.split("\n")
        current_block = None
        
        for line in sections:
            clean_line = line.strip()
            if clean_line.upper().startswith("HOOK:"):
                current_block = "hook"
                hook = clean_line.replace("HOOK:", "").strip()
            elif clean_line.upper().startswith("BODY:"):
                current_block = "body"
                body = clean_line.replace("BODY:", "").strip()
            elif clean_line.upper().startswith("CTA:"):
                current_block = "cta"
                cta = clean_line.replace("CTA:", "").strip()
            elif clean_line:
                if current_block == "hook": hook += " " + clean_line
                elif current_block == "body": body += " " + clean_line
                elif current_block == "cta": cta += " " + clean_line

        return {
            "hook": hook.strip() or "Stop scrolling! 🚨",
            "body": body.strip() or f"Check out this viral {product_name}.",
            "cta": cta.strip() or "Get 50% off tonight only!"
        }
    except Exception as e:
        print(f"[-] Groq API error: {e}")
        return {
            "hook": "Stop scrolling! 🚨",
            "body": f"This viral {product_name} completely transformed my late-night setup.",
            "cta": "Get 50% off tonight only. Click shop now!"
        }