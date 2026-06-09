import os
from gtts import gTTS
from pedalboard.io import AudioFile
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MUSIC_DIR = os.path.join(BASE_DIR, "assets", "music")
OUTPUT_DIR = os.path.join(BASE_DIR, "static", "outputs")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(MUSIC_DIR, exist_ok=True)

def generate_voice_over(text: str, voice_profile: str) -> str:
    print(f"[🎙️ TTS ENGINE] Generating voiceover for profile: '{voice_profile}'")
    lang = 'en'
    tld = 'com'
    
    if "male" in voice_profile.lower() or "adam" in voice_profile.lower():
        tld = 'co.uk'
    elif "oliver" in voice_profile.lower():
        tld = 'ca'
        
    tts = gTTS(text=text, lang=lang, tld=tld, slow=False)
    temp_voice_path = os.path.join(OUTPUT_DIR, f"temp_voice.mp3")
    tts.save(temp_voice_path)
    
    print(f"[🟢 TTS COMPLETED] Temporary voice saved at: {temp_voice_path}")
    return temp_voice_path

def mix_voice_and_background(voice_path: str, bg_music_type: str, output_filename: str) -> str:
    print(f"[🎵 AUDIO MIXER] Mixing voice with background music: '{bg_music_type}'")
    final_output_path = os.path.join(OUTPUT_DIR, f"{output_filename}.wav")
    
    if not os.path.exists(voice_path):
        print(f"[🚨 MIXER CRITICAL ERROR] Voice path does not exist: {voice_path}")
        return final_output_path

    with AudioFile(voice_path) as f:
        voice_audio = f.read(f.frames)
        sr = f.samplerate
        num_channels = f.num_channels

    bg_music_path = os.path.join(MUSIC_DIR, f"{bg_music_type.lower()}.mp3")
    
    if bg_music_type.lower() == "none" or not os.path.exists(bg_music_path):
        print(f"[⚠️ MIXER NOTIFICATION] Background music file not found or set to None. Exporting pure voice.")
        with AudioFile(final_output_path, 'w', sr, num_channels) as f:
            f.write(voice_audio)
        return final_output_path

    with AudioFile(bg_music_path) as f:
        bg_audio = f.read(f.frames)

    bg_audio = bg_audio * 0.12 

    if bg_audio.shape[1] < voice_audio.shape[1]:
        repeats = int(np.ceil(voice_audio.shape[1] / bg_audio.shape[1]))
        bg_audio = np.tile(bg_audio, (1, repeats))
    
    bg_audio = bg_audio[:, :voice_audio.shape[1]]
    mixed_audio = voice_audio + bg_audio
    
    with AudioFile(final_output_path, 'w', sr, num_channels) as f:
        f.write(mixed_audio)
    
    try:
        if os.path.exists(voice_path):
            os.remove(voice_path)
    except Exception as e:
        print(f"[-] Error cleaning up temp file: {e}")
        
    print(f"[🏆 MIXING SUCCESS] Final Master Audio baked perfectly at: {final_output_path}")
    return final_output_path