"""End-to-end automated demo video generation script for SynapseTV.
Synthesizes English TTS voiceover, generates synchronized 1080p video frames with UI overlays,
and outputs a complete demo video into docs/assets/demo_video.mp4.
"""
import os
import sys
import time
import wave
import numpy as np
import av
import cv2
import win32com.client

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSETS_DIR = os.path.join(BASE_DIR, "docs", "assets")
OUTPUT_MP4 = os.path.join(ASSETS_DIR, "demo_video.mp4")
TEMP_AUDIO = os.path.join(ASSETS_DIR, "demo_voiceover.wav")

STORYBOARD = [
    {
        "id": "scene_01",
        "title": "SynapseTV: Autonomous Living-Room Cognitive Hub",
        "narration": "Welcome to SynapseTV, an award-winning submission for the Amazon Developer Hackathon. SynapseTV transforms Amazon Fire TV from a passive screen into an empathetic cognitive living-room hub powered by an AWS Bedrock multi-agent swarm.",
        "image_file": "01_spatial_ui.png",
        "duration_sec": 14.0,
        "badge": "CHAPTER 1: INTRODUCTION & 10-FOOT TV ARCHITECTURE"
    },
    {
        "id": "scene_02",
        "title": "Dual-Stream Perception & Fire TV Remote D-Pad Navigation",
        "narration": "SynapseTV features synchronized dual-stream perception: outward video scene understanding paired with inward viewer gaze and spatial attention. Physical Fire TV remote keycodes are strictly normalized with a custom two-dimensional geometric spatial navigation engine.",
        "image_file": "01_spatial_ui.png",
        "duration_sec": 16.0,
        "badge": "CHAPTER 2: DUAL-STREAM PERCEPTION & SPATIAL D-PAD"
    },
    {
        "id": "scene_03",
        "title": "AWS Bedrock Multi-Agent Swarm & Live Tactical Explainer",
        "narration": "When Scene Sentinel detects a major tactical inflection in the match and Audience Aligner observes viewer confusion, the Bedrock Swarm reaches consensus. Powered by Claude 3.5 Haiku and Gemini, a high-contrast micro-explainer slides into view with tactical breakdowns and key facts.",
        "image_file": "05_cognitive_explainer.png",
        "duration_sec": 18.0,
        "badge": "CHAPTER 3: AWS BEDROCK SWARM & COGNITIVE EXPLAINER"
    },
    {
        "id": "scene_04",
        "title": "Zero-Touch Gestures & Autonomous Sleep Pause with Smart Bookmarks",
        "narration": "With zero-touch gestures, viewers can raise an open palm to mute or pause without reaching for the remote. When the viewer falls asleep or steps away, the co-viewer auto-pauses the stream, preserves context, and records a Smart Catch-Up Bookmark, resuming seamlessly the moment attention returns.",
        "image_file": "01_spatial_ui.png",
        "duration_sec": 17.0,
        "badge": "CHAPTER 4: ZERO-TOUCH GESTURES & SMART BOOKMARKS"
    },
    {
        "id": "scene_05",
        "title": "Amazon Contextual Retail & In-Stream Prime Shopping",
        "narration": "For Amazon Ads and Prime Video, SynapseTV powers in-stream contextual shopping. When objects like the official match ball are identified in play, a Prime retail overlay card appears. Viewers can add items directly to their Amazon Cart with one remote click, or scan the dynamic QR code for instant mobile checkout via Amazon Pay.",
        "image_file": "02_spotlight_product.png",
        "duration_sec": 19.0,
        "badge": "CHAPTER 5: AMAZON ADS & PRIME 1-CLICK RETAIL"
    },
    {
        "id": "scene_06",
        "title": "Senior Care & Amazon One Medical Emergency Sentinel",
        "narration": "In Senior Care mode, SynapseTV acts as a living-room safety sentinel. Detecting a sudden fall or unresponsive state, the screen dims and a gentle warning chime sounds. A thirty-second failsafe buffer allows viewers to confirm safety or auto-dispatches an emergency triage alert to Amazon One Medical and family caregivers via AWS SNS.",
        "image_file": "03_one_medical_triage.png",
        "duration_sec": 20.0,
        "badge": "CHAPTER 6: SENIOR CARE & ONE MEDICAL EMERGENCY"
    },
    {
        "id": "scene_07",
        "title": "Privacy Guard Kill-Switch & Production Edge Hardening",
        "narration": "Privacy is foundational: a dedicated hardware kill-switch disables the camera instantly for Blind D-Pad Mode, ensuring zero video frames ever leave the device. Furthermore, adaptive frame throttling down to two FPS preserves streaming stick thermals.",
        "image_file": "04_privacy_kill_switch.png",
        "duration_sec": 16.0,
        "badge": "CHAPTER 7: PRIVACY GUARD & ADAPTIVE COMPUTE"
    },
    {
        "id": "scene_08",
        "title": "Prime Video B2B Signage Metrics & Future of Smart TV",
        "narration": "With live enterprise dwell metrics, sixty FPS frame ingestion, and full living-room family consensus, SynapseTV delivers the future of intelligent television. Built, shipped, and shaped for the Amazon Developer Hackathon.",
        "image_file": "06_b2b_metrics.png",
        "duration_sec": 15.0,
        "badge": "CHAPTER 8: ENTERPRISE B2B SIGNAGE & SUMMARY"
    }
]

def synthesize_audio():
    """Generates continuous voiceover WAV file using SAPI."""
    print("Synthesizing voiceover narration via SAPI...")
    speaker = win32com.client.Dispatch("SAPI.SpVoice")
    stream = win32com.client.Dispatch("SAPI.SpFileStream")
    stream.Open(TEMP_AUDIO, 3)
    speaker.AudioOutputStream = stream

    # Speak narration sequentially with pauses
    for chapter in STORYBOARD:
        speaker.Speak(chapter["narration"])
        speaker.Speak(" ")

    stream.Close()
    print(f"Voiceover synthesized: {TEMP_AUDIO} ({os.path.getsize(TEMP_AUDIO):,} bytes)")

def create_demo_video():
    """Renders 1080p broadcast video with narration, subtitles, and chapter cards."""
    synthesize_audio()

    # Read audio duration and samples
    with wave.open(TEMP_AUDIO, 'rb') as wf:
        n_channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        n_frames = wf.getnframes()
        audio_duration = n_frames / float(framerate)
        audio_bytes = wf.readframes(n_frames)

    print(f"Total audio narration length: {audio_duration:.1f} seconds")

    # Target video specs
    fps = 30
    width = 1920
    height = 1080
    total_video_frames = int(audio_duration * fps)

    # Calculate frame distribution across chapters
    frames_per_chapter = []
    total_storyboard_time = sum(c["duration_sec"] for c in STORYBOARD)
    for c in STORYBOARD:
        ch_duration = (c["duration_sec"] / total_storyboard_time) * audio_duration
        frames_per_chapter.append(int(ch_duration * fps))

    # Adjust last chapter to match exact frame count
    frames_per_chapter[-1] = total_video_frames - sum(frames_per_chapter[:-1])

    # Preload chapter background images
    loaded_images = []
    for c in STORYBOARD:
        img_path = os.path.join(ASSETS_DIR, c["image_file"])
        if os.path.exists(img_path):
            img = cv2.imread(img_path)
            if img.shape[0] != height or img.shape[1] != width:
                img = cv2.resize(img, (width, height), interpolation=cv2.INTER_LANCZOS4)
        else:
            img = np.zeros((height, width, 3), dtype=np.uint8)
        loaded_images.append(img)

    print(f"Encoding {total_video_frames} frames into {OUTPUT_MP4} via PyAV H.264 & AAC...")

    # Setup PyAV output container with H.264 video + AAC audio
    container = av.open(OUTPUT_MP4, mode="w")

    video_stream = container.add_stream("h264", rate=fps)
    video_stream.width = width
    video_stream.height = height
    video_stream.pix_fmt = "yuv420p"
    video_stream.options = {"preset": "veryfast", "crf": "21"}

    # Setup audio stream
    audio_stream = container.add_stream("aac", rate=framerate)
    audio_stream.layout = "mono" if n_channels == 1 else "stereo"
    audio_stream.format = "fltp"

    # Mux audio samples
    audio_np = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    if n_channels == 1:
        audio_np = audio_np.reshape(1, -1)
    else:
        audio_np = audio_np.reshape(-1, 2).T

    frame_size = 1024
    num_audio_frames = audio_np.shape[1] // frame_size
    for i in range(num_audio_frames):
        chunk = audio_np[:, i * frame_size : (i + 1) * frame_size]
        aframe = av.AudioFrame.from_ndarray(chunk, format="fltp", layout="mono" if n_channels == 1 else "stereo")
        aframe.sample_rate = framerate
        aframe.pts = i * frame_size
        for packet in audio_stream.encode(aframe):
            container.mux(packet)

    for packet in audio_stream.encode():
        container.mux(packet)

    # Encode video frames with dynamic overlays, chapter badges, and progress bar
    frame_idx = 0
    chapter_idx = 0
    chapter_start_frame = 0

    while frame_idx < total_video_frames:
        if frame_idx >= chapter_start_frame + frames_per_chapter[chapter_idx] and chapter_idx < len(STORYBOARD) - 1:
            chapter_idx += 1
            chapter_start_frame = frame_idx

        ch = STORYBOARD[chapter_idx]
        base_img = loaded_images[chapter_idx].copy()

        # Dynamic ambient pan/zoom effect (1.0 to 1.03 scale)
        ch_progress = (frame_idx - chapter_start_frame) / max(1, frames_per_chapter[chapter_idx])
        zoom = 1.0 + 0.02 * np.sin(ch_progress * np.pi)
        if zoom > 1.0:
            M = cv2.getRotationMatrix2D((width / 2, height / 2), 0, zoom)
            base_img = cv2.warpAffine(base_img, M, (width, height))

        # Bottom broadcast ticker & subtitle bar
        overlay = base_img.copy()
        cv2.rectangle(overlay, (0, height - 90), (width, height), (8, 11, 16), -1)
        cv2.rectangle(overlay, (40, 35), (780, 85), (8, 11, 16), -1)
        cv2.addWeighted(overlay, 0.88, base_img, 0.12, 0, base_img)

        # Draw chapter badge
        cv2.rectangle(base_img, (40, 35), (780, 85), (255, 153, 0), 2)
        cv2.putText(base_img, ch["badge"], (55, 68), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 153, 0), 2, cv2.LINE_AA)

        # Draw narration subtitle
        sub_text = ch["narration"]
        if len(sub_text) > 95:
            split_idx = sub_text[:95].rfind(" ")
            line1 = sub_text[:split_idx]
            line2 = sub_text[split_idx + 1:min(len(sub_text), split_idx + 95)]
            cv2.putText(base_img, line1, (60, height - 52), cv2.FONT_HERSHEY_SIMPLEX, 0.72, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(base_img, line2, (60, height - 22), cv2.FONT_HERSHEY_SIMPLEX, 0.68, (200, 220, 240), 2, cv2.LINE_AA)
        else:
            cv2.putText(base_img, sub_text, (60, height - 38), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2, cv2.LINE_AA)

        # Global playback progress bar
        global_progress = frame_idx / total_video_frames
        cv2.rectangle(base_img, (0, height - 6), (int(width * global_progress), height), (0, 168, 225), -1)

        # Encode video frame
        vframe = av.VideoFrame.from_ndarray(base_img, format="bgr24")
        vframe.pts = frame_idx
        for packet in video_stream.encode(vframe):
            container.mux(packet)

        frame_idx += 1
        if frame_idx % 150 == 0:
            pct = int((frame_idx / total_video_frames) * 100)
            print(f"Render progress: {pct}% ({frame_idx}/{total_video_frames} frames)...")

    # Flush video stream
    for packet in video_stream.encode():
        container.mux(packet)

    container.close()
    print(f"\nDemo video successfully compiled: {OUTPUT_MP4}")
    print(f"File size: {os.path.getsize(OUTPUT_MP4):,} bytes ({os.path.getsize(OUTPUT_MP4)/(1024*1024):.2f} MB)")

if __name__ == "__main__":
    create_demo_video()
