from __future__ import annotations

from textwrap import dedent

from ..schemas.autocomplete import AutocompleteRequest


class SuggestionService:
    def __init__(self, placeholder: str) -> None:
        self.placeholder = placeholder

    def generate(self, payload: AutocompleteRequest) -> str:
        snippet = payload.code[: payload.cursorPosition]
        last_line = snippet.splitlines()[-1] if snippet else ''
        indent = len(last_line) - len(last_line.lstrip(' '))
        indent_spaces = ' ' * indent

        if payload.language.lower() == 'python':
            return dedent(
                f"""
                {indent_spaces}# Suggestion: consider adding logging here
                {indent_spaces}print('Pairing session active')
                """
            ).strip()

        return self.placeholder
