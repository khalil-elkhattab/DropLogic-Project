import os
from gtts import gTTS
from pedalboard.io import AudioFile
import numpy as np

# تحديد مسارات المجلدات الأساسية
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MUSIC_DIR = os.path.join(BASE_DIR, "assets", "music")
OUTPUT_DIR = os.path.join(BASE_DIR, "static", "outputs")

# التأكد من وجود مجلد المخرجات لمنع أخطاء النظام
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_voice_over(text: str, voice_profile: str) -> str:
    """
    1. محرك توليد الصوت البشري (TTS Engine)
    يأخذ النص النهائي ويحوله إلى ملف صوتي مؤقت عبر gTTS.
    """
    print(f"[🎙️ TTS ENGINE] Generating voiceover for profile: '{voice_profile}'")
    
    # تحديد اللغة (حالياً نستخدم الإنجليزية بناءً على نصوص الاستوديو)
    lang = 'en'
    tld = 'com'
    
    if voice_profile.lower() == "adam":
        tld = 'co.uk'  # نبرة بريطانية كمثال للتفريق
    elif voice_profile.lower() == "oliver":
        tld = 'ca'     # نبرة كندية
        
    tts = gTTS(text=text, lang=lang, tld=tld, slow=False)
    
    temp_voice_path = os.path.join(OUTPUT_DIR, f"temp_voice_{voice_profile}.mp3")
    tts.save(temp_voice_path)
    
    print(f"[🟢 TTS COMPLETED] Temporary voice saved at: {temp_voice_path}")
    return temp_voice_path


def mix_voice_and_background(voice_path: str, bg_music_type: str, output_filename: str) -> str:
    """
    2. محرك دمج الهندسة الصوتية (Audio Mixer Engine) عبر Spotify Pedalboard
    يقوم بدمج صوت المعلق مع الموسيقى الخلفية المحددة مع موازنة خفض الصوت (Ducking).
    """
    print(f"[🎵 AUDIO MIXER] Mixing voice with background music: '{bg_music_type}'")
    final_output_path = os.path.join(OUTPUT_DIR, f"final_{output_filename}.mp3")
    
    # 1. تحميل ملف الصوت البشري الأساسي وقراءة خاماته الرقمية
    with AudioFile(voice_path) as f:
        voice_audio = f.read(f.frames)
        sr = f.samplerate
        num_channels = f.num_channels

    # إذا اختار المستخدم بدون موسيقى خلفية (none)، نكتفي بملف الصوت البشري ونحفظه كمنتج نهائي
    if bg_music_type.lower() == "none":
        with AudioFile(final_output_path, 'w', sr, num_channels) as f:
            f.write(voice_audio)
        return final_output_path
        
    # 2. تحديد مسار ملف الموسيقى الخلفية
    bg_music_path = os.path.join(MUSIC_DIR, f"{bg_music_type.lower()}.mp3")
    
    if not os.path.exists(bg_music_path):
        print(f"[⚠️ MIXER WARNING] Background music file not found at: {bg_music_path}. Exporting pure voice.")
        with AudioFile(final_output_path, 'w', sr, num_channels) as f:
            f.write(voice_audio)
        return final_output_path

    # 3. تحميل ملف الموسيقى الخلفية
    with AudioFile(bg_music_path) as f:
        bg_audio = f.read(f.frames)

    # 4. عملية الـ Audio Ducking (خفض صوت الموسيقى بمقدار ذكي لكي لا تغطي على المعلق)
    bg_audio = bg_audio * 0.12  # ضرب المصفوفة في 0.12 يعادل خفض الصوت ليكون خلفية هادئة ونقية

    # 5. جعل طول الموسيقى الخلفية متطابقاً تماماً مع طول الكلام (Looping or Truncating)
    if bg_audio.shape[1] < voice_audio.shape[1]:
        # لو كانت الموسيقى قصيرة، نقوم بتكرارها لتغطي كامل النص عبر مصفوفات numpy السريعة
        repeats = int(np.ceil(voice_audio.shape[1] / bg_audio.shape[1]))
        bg_audio = np.tile(bg_audio, (1, repeats))
    
    # قص الموسيقى الزائدة لتنتهي مع نهاية آخر كلمة من المعلق الصوتي تماماً
    bg_audio = bg_audio[:, :voice_audio.shape[1]]
    
    # 6. عملية الدمج الفعلي (Overlay الأرقام المباشر)
    mixed_audio = voice_audio + bg_audio
    
    # 7. تصدير وحفظ الملف الصوتي النهائي بأعلى نقاء للأستوديو
    with AudioFile(final_output_path, 'w', sr, num_channels) as f:
        f.write(mixed_audio)
    
    # 8. تنظيف الذاكرة وحذف الملف الصوتي المؤقت الصافي لمنع تراكم الملفات
    try:
        os.remove(voice_path)
    except Exception as e:
        print(f"[-] Error cleaning up temp file: {e}")
        
    print(f"[🏆 MIXING SUCCESS] Final Master Audio baked perfectly at: {final_output_path}")
    return final_output_path