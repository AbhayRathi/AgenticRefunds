# Task

Build a high-fidelity frontend clone of the DoorDash mobile app (Order History & Support Chat). This is the client-side interface for a demo showcasing an "Automated Agentic Refund" system backed by MongoDB and Coinbase x402, plus a proactive Trust Score agent that can issue surprise DoorDash credit before any refund is negotiated.

# Application Flow & Requirements

## View 1.5: Proactive Trust Repair (Before Chat)

**Goal:** The Trust Agent detects frustration signals while the user is still browsing the order/store UI, calculates a Trust Score, and issues **store credit proactively** *before* the user initiates the refund flow.

### Trust Score UI Signals (Captured outside chat)
The Trust Agent calculates a **Trust Score (0–100)** from user behavior signals captured in View 1 / Store browsing (purely client-side for demo). Implement these signals so judges can *see* the model reacting to frustration *before* the user asks for help.

**Signals to demo (must be visible in the UI):**
- **Rage Tap:** User taps the same element 3+ times within 1.5s (e.g., the order card, store name, or receipt link).
- **Fast Back-and-Forth Navigation:** User switches between **Order History** and **Store page** 2+ times within 10s.
- **Receipt Zoom / Scrub:** User rapidly opens/expands receipt details twice (simulate “double-checking” behavior).
- **Negative Reaction Chip:** Add a chip on the order detail view: "This is unacceptable".
- **Abandoned Draft:** If you have a lightweight search box / notes field in the order detail view, detect typing >25 chars then clearing.

### UI Requirement (Pre-chat)
- Add a subtle, collapsible **"Trust Signals"** panel in the **View 1 header** (shield icon). It lists triggered signals in real-time and shows the current Trust Score.
- When the Trust Score drops below a threshold (e.g., <40), show an **in-app toast/banner**: "We noticed frustration signals — running a quick trust check…"

### Proactive Credit Experience
- After the "Analyzing Trust Signals" moment, show a **Credit Granted** card as a banner in View 1 (not in chat):
  - Title: "Instant Credit Granted"
  - Amount: "$25 DoorDash Credit"
  - Subtext: "Applied automatically to your next order"
  - Badge: "Proactive Trust Repair"
  - Small line: "Trust Score: 27/100"

### Important Demo Note
- Even after credit is granted, the demo continues: the user still clicks **"Issue with my order"** to initiate the refund chat flow.

## View 2: The Agentic Chat (The Core Demo)

- **Personas (Chat is Refund-only; Trust is pre-chat):**
  - **Pre-Chat Agent:** "DoorDash Trust Agent (AI)" (calculates Trust Score + issues proactive DoorDash credit in View 1.5).
  - **Chat Agent:** "DoorDash Refund Agent (AI)" (validates evidence + negotiates + triggers Coinbase x402 refund).

**Interaction Script (Implement this exact flow in the mock hook):**

### Chat Phase — Evidence + Negotiated Refund (Refund Agent)

**Step 0: Entry (User explicitly starts refund chat after pre-credit)**
- **User Action (in View 1):** Click "Issue with my order" (even if credit already appeared).

**Step 1: Initialization**
- **Agent (Refund):** "Hi! I see your order from [MongoDB] just arrived. Is something wrong?"
- **User Action:** Click Suggestion Chip: "Wrong items delivered."

**Step 2: Evidence Collection**
- **Agent (Refund):** "Thanks — what did you receive instead?"
- **User Action:** Click Suggestion Chip: "I got 2 Burritos and the Salad. Missing Taco & Fajita."

**Step 3: The "Thinking" State (Crucial)**
- Show a UI state: "Checking Inventory & Receipt (MongoDB)…"
- **Agent (Refund):** "I see. You received 2 Burritos ($12 ea) instead of the Taco and Fajita. Did you consume the items?"

**Step 4: The Negotiation**
- **User Action:** Click Suggestion Chip: "I ate 80% of one burrito. The other is untouched."
- **Agent (Refund):** "Okay. Since one burrito was mostly consumed, I cannot fully refund it. However, I can offer a negotiated partial refund."
- **Agent (Refund) (Display a 'Proposal Card' in chat):**
  - **Item 1 (Burrito - Intact):** $12.00 Refund (Full).
  - **Item 2 (Burrito - Eaten):** $5.00 Credit (Partial).
  - **Total Refund:** $17.00.
  - *Buttons:* [Accept Offer] [Decline]

**Step 5: Settlement (Coinbase x402)**
- **User Action:** Click [Accept Offer].
- **Agent (Refund):** "Processing instant refund via Coinbase x402…"
- **Final UI:** Show a distinct "Transaction Complete" card with a green checkmark and "Funds Settled: $17.00".

# Key Implementation Detail

- Messages must support an explicit `agent` field (e.g., `"trust" | "refund" | "system"`) so the UI can render distinct avatars/nameplates.
- The Trust Signals panel should be driven by local UI events (rage taps, abandoned typing, negative chip clicks) and update the Trust Score live during Phase 1.
- The proactive credit banner/card must render in View 1 (pre-chat) and persist visually (e.g., in a "Credits" pill) when the user later enters the chat.