"""Headless automated script to capture full 1080p presentation screenshots of SynapseTV."""
import os
import time
import requests
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3000"
API_URL = "http://localhost:8000"
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs", "assets"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

def setup_driver():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--window-size=1920,1080')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--force-device-scale-factor=1')
    options.add_argument('--hide-scrollbars')
    options.add_argument('--mute-audio')
    driver = webdriver.Edge(options=options)
    driver.set_window_size(1920, 1080)
    return driver

def capture_screenshots():
    print(f"Connecting to {BASE_URL}...")
    driver = setup_driver()

    try:
        driver.get(BASE_URL)
        time.sleep(3.5)  # Allow video & WebSockets to initialize

        # 1. 01_spatial_ui.png: Default 10-foot player
        print("Capturing 01_spatial_ui.png...")
        path_01 = os.path.join(OUTPUT_DIR, "01_spatial_ui.png")
        driver.save_screenshot(path_01)
        print(f"Saved: {path_01}")

        # 2. 02_spotlight_product.png: Trigger Spotlight Product (Amazon Retail Synergy)
        print("Capturing 02_spotlight_product.png...")
        try:
            spotlight_btn = driver.find_element(By.ID, "btn-sim-spotlight")
            spotlight_btn.click()
        except Exception:
            requests.post(f"{API_URL}/api/spotlight-product?product_type=ball")
        time.sleep(1.8)
        path_02 = os.path.join(OUTPUT_DIR, "02_spotlight_product.png")
        driver.save_screenshot(path_02)
        print(f"Saved: {path_02}")

        # Dismiss spotlight
        try:
            dismiss_shop = driver.find_element(By.ID, "btn-amazon-dismiss")
            dismiss_shop.click()
            time.sleep(0.5)
        except Exception:
            pass

        # 3. 03_one_medical_triage.png: Trigger Simulate Fall (Senior Care Sentinel)
        print("Capturing 03_one_medical_triage.png...")
        try:
            fall_btn = driver.find_element(By.ID, "btn-sim-fall")
            fall_btn.click()
        except Exception:
            requests.post(f"{API_URL}/api/emergency-alert")
        time.sleep(2.0)
        path_03 = os.path.join(OUTPUT_DIR, "03_one_medical_triage.png")
        driver.save_screenshot(path_03)
        print(f"Saved: {path_03}")

        # Dismiss emergency with "I'm OK"
        try:
            safe_btn = driver.find_element(By.ID, "btn-emergency-safe")
            safe_btn.click()
            time.sleep(1.0)
        except Exception:
            requests.post(f"{API_URL}/api/emergency-dismiss?learn_relax=false")
            time.sleep(1.0)

        # 4. 04_privacy_kill_switch.png: Trigger Camera Privacy Kill-Switch
        print("Capturing 04_privacy_kill_switch.png...")
        try:
            # Click Kill-Switch button in HUD
            kill_btns = driver.find_elements(By.XPATH, "//button[contains(text(), 'Kill-Switch') or contains(text(), 'Camera Killed')]")
            if kill_btns:
                kill_btns[0].click()
                time.sleep(1.2)
        except Exception as e:
            print("Privacy toggle note:", e)

        path_04 = os.path.join(OUTPUT_DIR, "04_privacy_kill_switch.png")
        driver.save_screenshot(path_04)
        print(f"Saved: {path_04}")

        # Toggle Privacy switch back off to re-enable camera
        try:
            kill_btns = driver.find_elements(By.XPATH, "//button[contains(text(), 'Kill-Switch') or contains(text(), 'Camera Killed')]")
            if kill_btns:
                kill_btns[0].click()
                time.sleep(1.0)
        except Exception:
            pass

        # 5. 05_cognitive_explainer.png: Trigger Confused (Explain) Bedrock Swarm
        print("Capturing 05_cognitive_explainer.png...")
        try:
            confuse_btn = driver.find_element(By.ID, "btn-sim-confuse")
            confuse_btn.click()
        except Exception:
            requests.post(f"{API_URL}/api/simulate-state?confusion=0.85&attention=0.90&playback_time=60.0")
        time.sleep(3.0)  # Allow multi-tier LLM swarm synthesis
        path_05 = os.path.join(OUTPUT_DIR, "05_cognitive_explainer.png")
        driver.save_screenshot(path_05)
        print(f"Saved: {path_05}")

        # 6. 06_b2b_metrics.png: Prime Video & B2B Signage Metrics focus
        print("Capturing 06_b2b_metrics.png...")
        # Reset attentive state for clean view
        try:
            reset_btn = driver.find_element(By.ID, "btn-sim-reset")
            reset_btn.click()
        except Exception:
            requests.post(f"{API_URL}/api/simulate-state?gaze=attentive&attention=0.95")
        time.sleep(1.5)
        path_06 = os.path.join(OUTPUT_DIR, "06_b2b_metrics.png")
        driver.save_screenshot(path_06)
        print(f"Saved: {path_06}")

        print("\nAll 6 presentation screenshots successfully captured in 1920x1080!")

    finally:
        driver.quit()

if __name__ == "__main__":
    capture_screenshots()
