"""AWS Bedrock and Multi-Tier LLM client wrapper orchestrating Gemini, Nebius, and OpenRouter."""
import json
import logging
import asyncio
from typing import Dict, Any, Optional, Tuple
from app.config import get_settings
from app.agents.llm_swarm import get_llm_swarm_client

logger = logging.getLogger("synapse.bedrock")
settings = get_settings()

try:
    import boto3
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False


class BedrockAgentClient:
    """Enterprise client managing Multi-Tier LLM routing (Gemini -> Nebius -> OpenRouter -> Bedrock)."""

    def __init__(self):
        self.settings = settings
        self.client = None
        self.is_mock = True
        self.multi_tier = get_llm_swarm_client()
        self._initialize_client()

    def _initialize_client(self):
        """Attempts to initialize Boto3 Bedrock Runtime client if AWS credentials exist."""
        if self.settings.FORCE_MOCK_BEDROCK or not BOTO3_AVAILABLE:
            self.is_mock = True
            return

        try:
            kwargs: Dict[str, Any] = {
                "service_name": "bedrock-runtime",
                "region_name": self.settings.AWS_REGION
            }
            if self.settings.AWS_ACCESS_KEY_ID and self.settings.AWS_SECRET_ACCESS_KEY:
                kwargs["aws_access_key_id"] = self.settings.AWS_ACCESS_KEY_ID
                kwargs["aws_secret_access_key"] = self.settings.AWS_SECRET_ACCESS_KEY
                if self.settings.AWS_SESSION_TOKEN:
                    kwargs["aws_session_token"] = self.settings.AWS_SESSION_TOKEN

            self.client = boto3.client(**kwargs)
            self.is_mock = False
            logger.info(f"Bedrock Runtime client initialized for region: {self.settings.AWS_REGION}")
        except Exception as exc:
            logger.warning(f"Could not connect to AWS Bedrock ({exc}). Multi-tier LLM engine active.")
            self.is_mock = True

    async def invoke_claude(
        self,
        prompt: str,
        system_prompt: str = "You are SynapseTV's real-time cognitive reasoning engine for Fire TV.",
        model_id: Optional[str] = None,
        routing_tier: str = "vision",
        max_tokens: int = 400,
        temperature: float = 0.2
    ) -> str:
        """
        Executes prompt through the Multi-Tier Resilient Engine:
        1. Gemini 2.5 Flash (Primary Multimodal Vision & Explainers)
        2. Nebius Llama/Qwen (High-speed Cognitive Decisions)
        3. OpenRouter Claude Sonnet (Fallback Reasoning Swarm)
        4. AWS Bedrock / Mock
        """
        # Execute multi-tier cascade
        response, provider = await self.multi_tier.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            routing_preference=routing_tier,
            max_tokens=max_tokens,
            temperature=temperature
        )
        return response

    async def generate_with_routing(
        self,
        prompt: str,
        system_prompt: str,
        routing_tier: str = "vision",
        max_tokens: int = 400
    ) -> Tuple[str, str]:
        """Returns tuple of (response_text, provider_used) for telemetry HUD."""
        return await self.multi_tier.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            routing_preference=routing_tier,
            max_tokens=max_tokens
        )


_bedrock_client_instance: Optional[BedrockAgentClient] = None

def get_bedrock_client() -> BedrockAgentClient:
    global _bedrock_client_instance
    if _bedrock_client_instance is None:
        _bedrock_client_instance = BedrockAgentClient()
    return _bedrock_client_instance
