from pydantic import BaseModel, Field


class AutocompleteRequest(BaseModel):
    code: str = Field(..., description='Full buffer currently in the editor')
    cursorPosition: int = Field(..., ge=0, description='Caret offset in the buffer')
    language: str = Field(default='python', description='Programming language of the buffer')


class AutocompleteResponse(BaseModel):
    suggestion: str
