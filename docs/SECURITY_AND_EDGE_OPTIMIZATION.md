# SynapseTV Security, Privacy & Edge Optimization Guide
*Production-Grade Edge Guardrails & Living-Room Safeguards for Fire OS / Vega OS*

---

## 1. Executive Summary

In smart TV environments, user privacy and thermal/compute constraints are paramount. A living room camera and AI hub must earn the household's absolute trust while running smoothly on resource-constrained TV streaming hardware (such as the Amazon Fire TV Stick 4K and Fire TV Omni).

This specification outlines the **5 Production-Grade Edge Guardrails** engineered into SynapseTV:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SYNAPSE-TV PRODUCTION EDGE GUARDRAILS                           │
└────────┬───────────────────────┬───────────────────────┬───────────────────────┬───────┘
         │                       │                       │                       │
         ▼                       ▼                       ▼                       ▼
  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
  │ SAFEGUARD 1:│         │ SAFEGUARD 2:│         │ SAFEGUARD 3:│         │ SAFEGUARD 4:│
  │ Privacy-1st │         │ Adaptive    │         │ False-Pos   │         │ Distraction │
  │ Edge Only & │         │ Compute &   │         │ Triage Guard│         │ Free Immersi│
  │ Kill-Switch │         │ Thermal Thro│         │ One Medical │         │ Mode        │
  └─────────────┘         └─────────────┘         └─────────────┘         └─────────────┘
                                 │
                                 ▼
                          ┌─────────────┐
                          │ SAFEGUARD 5:│
                          │ Multi-Viewer│
                          │ Majority    │
                          │ Attention   │
                          └─────────────┘
```

---

## 2. The Five Production Guardrails

### 🔒 1. Privacy-First Architecture & Hardware Kill-Switch
* **Zero Cloud Video Ingestion:** SynapseTV guarantees that **no video frames, raw pixels, or audio recordings are ever uploaded to AWS or any cloud provider**.
* **100% On-Device Coordinate Inference:** All facial landmarks, eye aspect ratios (EAR), and hand vectors are computed strictly in local memory using WebAssembly / MediaPipe. The cloud only receives anonymized discrete state strings (e.g. `gaze_status: "attentive"`).
* **Hardware Privacy Kill-Switch:**
  - When the user toggles the Camera Privacy Kill-Switch, the camera hardware track is terminated (`track.stop()`), the webcam video element is severed from memory, and the system transitions into **"Blind D-Pad Mode"**, falling back to standard remote controls without perception.

---

### ⚡ 2. Adaptive Compute & Thermal Throttle (Edge Optimization)
TV streaming sticks have limited CPU/GPU thermal dissipation headroom. SynapseTV features a three-tier adaptive inference scheduler:

| Power Mode | Inference Sampling Rate | Target Hardware Profile | CPU/GPU Footprint |
| :--- | :--- | :--- | :--- |
| **Eco Mode** | **2 FPS** | Fire TV Stick Lite / HD | $< 3\%$ CPU utilization |
| **Balanced Mode** | **15 FPS** | Fire TV Stick 4K / Max | $< 8\%$ CPU utilization |
| **Turbo Mode** | **60 FPS** | Fire TV Omni / Cube / Vega OS | Maximum responsiveness ($< 15\%$ CPU) |

* **Zero-Face Thermal Throttling:** When no viewer is detected in the camera's field of view for $> 15\text{s}$, the neural vision pipeline automatically throttles down to 0.5 Hz (1 frame every 2 seconds) until motion re-enters the frame.

---

### 🏥 3. False-Positive Buffer & Quick Cancel (Triage Guard)
In-home health sentinels can suffer from false alarms if a senior lies down on the sofa or reclines to rest. SynapseTV solves this with a multi-stage triage guard:
1. **30-Second Warning Buffer:** Plays a soft non-alarming chime and displays a prominent 30-second countdown before any external AWS SNS or One Medical dispatch occurs.
2. **"I'm Just Relaxing / Watching" Quick Cancel:**
   - Pressing this button immediately cancels the dispatch, records the current viewer resting posture as normal, and arms session-level suppression.
   - Future reclined or horizontal watching postures during that stream will not trigger false alarms.

---

### 🎬 4. Distraction-Free / Non-Intrusive Immersion Mode
* A living-room screen must remain first and foremost an entertaining viewing experience.
* **Distraction-Free Mode (Shortcut: `D` or Remote Menu):**
  - Collapses all telemetry sidebars and status pills into a completely clean, edge-to-edge 4K video canvas.
  - Subdues background explainers; micro-explainers only slide in when high cognitive confusion is validated or when the viewer explicitly presses `Enter`.
  - Auto-dismiss timers (12–16 seconds) ensure overlays never linger on the screen.

---

### 👨‍👩‍👧‍👦 5. Multi-Viewer Living Room Policy (Majority Attention Rule)
In single-viewer mode, the TV pauses as soon as the solitary viewer falls asleep or steps away. However, in a living-room family setting, pausing when *one* family member falls asleep ruins the experience for everyone else.

* **Family Mode Logic:**
  $$\text{AutoPauseTriggered} = (\text{LivingRoomPolicy} == \text{FamilyMode}) \implies \left(\frac{\text{AttentiveViewers}}{\text{TotalViewers}} == 0\right)$$
* If three family members are watching and one falls asleep or looks at their phone, the broadcast **continues uninterrupted** because other family members are still actively engaged. The TV only pauses when the entire room has disengaged or fallen asleep.

---

## 3. Compliance & Enterprise Security Standards

- **HIPAA Compliance Readiness:** Emergency telemetry dispatches contain only incident timestamps and optical motion vectors; no Protected Health Information (PHI) or video media is transmitted over AWS SNS.
- **Children's Online Privacy Protection (COPPA):** Pure coordinate parsing prevents facial biometric identification or minor facial recognition storage.
- **Zero-Storage Ephemeral Pipeline:** WebSocket frame coordinates are discarded immediately after consensus calculation, retaining only the integer timestamp for smart bookmarks.
