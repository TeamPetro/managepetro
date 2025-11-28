import pytest
from services.llm_service import LLMService

@pytest.mark.parametrize("input_text,expected", [
    ("**bold**", "bold"),
    ("*italic*", "italic"),
    ("__underline__", "underline"),
    ("normal text", "normal text"),
])
def test_clean_markdown(input_text, expected):
    llm = LLMService()
    assert llm._clean_markdown(input_text) == expected
