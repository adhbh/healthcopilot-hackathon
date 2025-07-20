# HealthCopilot Video Call Feature

This repository adds a secure, AI-powered **Video Call** feature to [HealthCopilot](https://www.yourhealthcopilot.io/), enabling real-time health management and conversation through WhatsApp and web video. The solution is composed of two main components:

- [`meet/`](./meet): A Next.js/React frontend for LiveKit-based video conferencing.
- [`livekit-agent/`](./livekit-agent): A Python backend agent for LiveKit, enabling AI-driven avatar participation and orchestration.

---

## About HealthCopilot

**HealthCopilot** is your smart, proactive health assistant—available 24/7 through WhatsApp. It helps you:

- Analyze lab reports
- Track medications, appointments, and symptoms
- Create diet and lifestyle plans based on your medical history
- Manage your health through simple chat—no apps, no portals, just conversation

**Internally, HealthCopilot leverages a complex Retrieval-Augmented Generation (RAG) pipeline and agent orchestration to deliver personalized, context-aware health management.**

HealthCopilot internally uses [langraph](https://github.com/langraph-ai/langraph) and an extensive graph-based retrieval system to enable highly personalized, context-aware outputs for every user.

<p align="center">
  <img src="meet/public/images/healthcopilot-graph.png" alt="HealthCopilot Retrieval & Agent Orchestration Graph" width="600"/>
</p>
<sub><b>Figure:</b> HealthCopilot's internal graph for retrieval and agent orchestration, enabling personalized health management.</sub>

---

## Project Structure

```
/
├── meet/              # Next.js frontend for video calls
├── livekit-agent/     # Python backend agent for LiveKit
└── README.md          # This documentation
```

---

## 1. `meet/` — Video Call Frontend

A modern, React-based web client for LiveKit video rooms, integrated with HealthCopilot.

### Features

- Join secure video rooms with LiveKit
- Token-based authentication via backend API
- Customizable UI, camera/mic controls, and recording
- Designed for seamless integration with WhatsApp and HealthCopilot workflows

### Setup & Installation

**Requirements:**
- Node.js >= 18
- [pnpm](https://pnpm.io/) (recommended)

**Install dependencies:**
```sh
cd meet
pnpm install
```

**Configure environment:**
Copy `.env.example` to `.env` and set your LiveKit credentials:
```
LIVEKIT_URL=wss://your-livekit-server-url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

**Run the development server:**
```sh
pnpm dev
```
The app will be available at [http://localhost:3000](http://localhost:3000).

### Key APIs & Endpoints

- `GET /api/connection-details?roomName=...&participantName=...`
  - Returns a LiveKit access token and connection details for the frontend client.
  - See [`meet/app/api/connection-details/route.ts`](./meet/app/api/connection-details/route.ts)

### Main Frameworks & Tools

- [Next.js](https://nextjs.org/) (React 18)
- [LiveKit Components React](https://docs.livekit.io/home/quickstarts/react)
- [TypeScript](https://www.typescriptlang.org/)
- [Prettier](https://prettier.io/), [ESLint](https://eslint.org/)

---

## 2. `livekit-agent/` — LiveKit AI Agent Backend

A Python agent that connects to LiveKit rooms, enabling AI-powered avatar participation and orchestration.

### Features

- Connects to LiveKit as an agent/participant
- Integrates with Beyond Presence API for avatar rendering
- Uses OpenAI and custom LLMs for conversational intelligence
- Dispatches agents to handle calls and interact with users

### Setup & Installation

**Requirements:**
- Python >= 3.9

**Install dependencies:**
```sh
cd livekit-agent
pip install -r requirements.txt
```

**Configure environment:**
Copy `.env.template` to `.env` and set:
- LiveKit server credentials
- Beyond Presence API key
- OpenAI API key

**Run the agent:**
```sh
python main.py [--avatar-id YOUR_AVATAR_ID]
```
If no `--avatar-id` is provided, the default avatar is used.

### Main Frameworks & Tools

- [livekit-agents](https://pypi.org/project/livekit-agents/) (Python)
- [Beyond Presence API](https://docs.bey.dev/integration/livekit)
- [OpenAI API](https://platform.openai.com/)
- [aiohttp](https://docs.aiohttp.org/)
- [python-dotenv](https://pypi.org/project/python-dotenv/)

### Documentation

- [Beyond Presence Integration & API Reference](https://docs.bey.dev/integration/livekit)
- [LiveKit Voice Agent Quickstart](https://docs.livekit.io/agents/start/voice-ai)
- [LiveKit React Integration Guide](https://docs.livekit.io/home/quickstarts/react)

---

## Integration & Architecture

- **Frontend (`meet/`)** requests a secure token from its backend API, then connects to the LiveKit server for video calls.
- **Backend agent (`livekit-agent/`)** joins the same LiveKit room as an AI-powered avatar, enabling advanced conversational and orchestration capabilities.
- **HealthCopilot** orchestrates user context, medical data, and agent actions using a RAG pipeline, ensuring personalized, context-aware health management.

---

## License

See [`meet/LICENSE`](./meet/LICENSE).

---

## Contributing

Pull requests and issues are welcome! Please ensure all code is well-documented and tested.

---

## Contact

For questions or support, please contact the HealthCopilot team via [https://www.yourhealthcopilot.io/](https://www.yourhealthcopilot.io/).
