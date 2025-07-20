from livekit.plugins import silero
import argparse
import sys
from functools import partial
from typing import Optional

from dotenv import load_dotenv
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    RoomOutputOptions,
    WorkerOptions,
    WorkerType,
    cli,
)
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import bey, openai, deepgram, noise_cancellation
import aiohttp
from livekit.plugins.turn_detector.multilingual import MultilingualModel
import logging

logger = logging.getLogger("unified_chat_tool")
if not logger.hasHandlers():
    logging.basicConfig(level=logging.INFO)
import json

from livekit.agents.llm.tool_context import function_tool

load_dotenv()

# class Assistant(Agent):
#     def __init__(self) -> None:
#         super().__init__(instructions="You are a helpful voice AI assistant.")


import time

@function_tool(name="unified_chat", description="Always call the /api/unified-chat/ API and say the response.")
async def unified_chat_tool(input_text: str) -> str:
    start = time.perf_counter()
    result = await call_unified_chat_api(input_text)
    elapsed = time.perf_counter() - start
    timer_message = (
        "\n"
        "============================\n"
        f"  LLM tool response time:\n"
        f"  {elapsed:.2f} seconds\n"
        "============================\n"
    )
    logger.info(timer_message)
    print(timer_message)
    return f"{result}\n\n[LLM tool response time: {elapsed:.2f} seconds]"

async def call_unified_chat_api(message: str) -> str:
    """
    Calls the /api/unified-chat endpoint with the given message and returns the streamed response as a string.
    Handles redirects and JSON error responses gracefully.
    """
    url = "http://localhost:3000/api/unified-chat"
    headers = {
        "Accept": "*/*",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8,de;q=0.7",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Content-Type": "text/plain;charset=UTF-8",
        "Origin": "http://localhost:3000",
        "Pragma": "no-cache",
        "Referer": "http://localhost:3000/chat",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
        "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
    }
    data = json.dumps({"message": message, "threadId": None})
    cookies = {
        "__clerk_db_jwt": "dvb_2zTdnLJpVHDqiiXAV8577AP1Nji",
        "__clerk_db_jwt_8aoHHG7G": "dvb_2zTdnLJpVHDqiiXAV8577AP1Nji",
        "__client_uat_8aoHHG7G": "0",
        "__client_uat": "0",
        "firebase-token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImE4ZGY2MmQzYTBhNDRlM2RmY2RjYWZjNmRhMTM4Mzc3NDU5ZjliMDEiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiYWRoZWVzaCBiaGF0aWEiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTEV3NTVSSDd3WWFKbG1sUnFVSEVwanJkclFlV2tTNzFabkJfQjU4VF8xa1ZPRFRwX05tUT1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9oZWFsdGhjb3BpbG90LWJmYjJjIiwiYXVkIjoiaGVhbHRoY29waWxvdC1iZmIyYyIsImF1dGhfdGltZSI6MTc1Mjk0NDgzMywidXNlcl9pZCI6Ijhad1JMem5xcDBOVEl3REVNaEFrQmhnTzMzbTEiLCJzdWIiOiI4WndSTHpucXAwTlRJd0RFTWhBa0JoZ08zM20xIiwiaWF0IjoxNzUyOTQ0ODMzLCJleHAiOjE3NTI5NDg0MzMsImVtYWlsIjoiYWRoZWVzaGJoYXRpYUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjEwMTEzNDE1NzY2MjI4ODgzMDQ5MCJdLCJlbWFpbCI6WyJhZGhlZXNoYmhhdGlhQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.DYZl2PgFWLBZLSPSmCjAuPaQ1mvqjJiYgpobBd3HhaBwbsd72TrN6WDIIGmUdQdz2VlHN4vnNY642EiY1Zahf0TtRbUWAeJzpYVMRB35HDYW6GaClMOeKbGaUiT3ezlAa50Wy7SeZ5NrST6FjhqfEIiKepql4XwOr--EFEFNgTl-fwZ3tNI_29ne3ZYpq3mAyOnsnDBSyMTbdk_aIoqwC4m8IITrnun8Ebw4eUGfWdFjFNeq06-M7-zZkTS8tEWjiyeIO6jCpte_Cvj0btANxSs_IS9Dk0LOGHtQTLNmoyKRndBWUSoISZKJVoAMhjm3yACB3wYcnKRvt-cPMCVciQ",
        "__next_hmr_refresh_hash__": "d0b1669f201bb1e36adaf1ad4a91171ff1cac5bd8b07e0aa"
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, data=data, cookies=cookies, allow_redirects=True) as resp:
            # Handle JSON error response
            content_type = resp.headers.get("content-type", "")
            if resp.status != 200:
                if "application/json" in content_type:
                    error_json = await resp.json()
                    return f"API Error: {error_json.get('error', str(error_json))}"
                else:
                    return f"API Error: HTTP {resp.status}"
            # Handle text/event-stream or plain text
            if "text/event-stream" in content_type:
                # Parse SSE stream, extract 'content' from JSON in 'data:' lines
                import re
                import json as pyjson
                answer_parts = []
                buffer = ""
                async for chunk, _ in resp.content.iter_chunks():
                    if chunk:
                        buffer += chunk.decode("utf-8")
                        # Split on newlines, process complete lines
                        while "\n" in buffer:
                            line, buffer = buffer.split("\n", 1)
                            line = line.strip()
                            if line.startswith("data: "):
                                try:
                                    payload = pyjson.loads(line[6:])
                                    # If this is a partial or complete AI message, extract content
                                    if isinstance(payload, dict):
                                        # Handle OpenAI-style: data: {"id":...,"event":"messages/partial",...}
                                        if payload.get("event") in ("messages/partial", "messages/complete"):
                                            data = payload.get("data")
                                            if isinstance(data, list):
                                                for item in data:
                                                    content = item.get("content")
                                                    if content:
                                                        answer_parts.append(content)
                                            elif isinstance(data, dict):
                                                content = data.get("content")
                                                if content:
                                                    answer_parts.append(content)
                                        # Handle LangChain-style: data: {"content": "..."}
                                        elif "content" in payload:
                                            answer_parts.append(payload["content"])
                                except Exception:
                                    pass
                return "\n".join(answer_parts).strip() if answer_parts else "No answer found in event stream."
            elif "text/" in content_type or "text" in content_type:
                response_text = ""
                async for chunk, _ in resp.content.iter_chunks():
                    if chunk:
                        response_text += chunk.decode("utf-8")
                return response_text
            # Fallback: try to read as text
            return await resp.text()

async def entrypoint(ctx: JobContext, avatar_id: Optional[str]) -> None:
# async def entrypoint(ctx: JobContext) -> None:
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    local_agent_session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=openai.LLM(model="gpt-4.1-mini"),
        tts = openai.TTS(model="gpt-4o-mini-tts",voice="ash"),
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )

    if avatar_id is not None:
        bey_avatar_session = bey.AvatarSession(avatar_id=avatar_id)
    else:
        bey_avatar_session = bey.AvatarSession()
    await bey_avatar_session.start(local_agent_session, room=ctx.room)
    

    await local_agent_session.start(
        agent=Agent(
            instructions=(
                "Be helpful medical assistant. When user asks for personal details - "
                "call the /api/unified-chat/ API and summarize the response quick and tell me concisely.\n"
                "If you call the tool - please tell them that you are looking into the report before calling the tool.\n"
                "Always be super concise and let user ask more details, dont elaborate unless asked."
                "If you feel there is any random transcriptions in between when you receive informtion\n"
                "on tool call which is not relevant for this use case (say any noise) please ignore and focus on the tool answer and proceed from there."
            ),
            tools=[unified_chat_tool],
        ),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(), 
        ),
    )

    await ctx.connect()

    # await session.generate_reply(
    #     instructions="Greet the user and offer your assistance."
    # )

# if __name__ == "__main__":
    # agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))


if __name__ == "__main__":
    load_dotenv()

    parser = argparse.ArgumentParser(description="Run a LiveKit agent with Bey avatar.")
    parser.add_argument("--avatar-id", type=str, help="Avatar ID to use.")
    args = parser.parse_args()

    sys.argv = [sys.argv[0], "dev"]  # overwrite args for the LiveKit CLI
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=partial(entrypoint, avatar_id=args.avatar_id),
            worker_type=WorkerType.ROOM,
        )
    )
