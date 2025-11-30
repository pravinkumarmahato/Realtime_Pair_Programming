from fastapi import APIRouter, Depends

from ...schemas.autocomplete import AutocompleteRequest, AutocompleteResponse
from ...services.suggestions import SuggestionService
from ..deps import get_suggestion_service

router = APIRouter(tags=['autocomplete'])


@router.post('/autocomplete', response_model=AutocompleteResponse)
async def autocomplete(
    payload: AutocompleteRequest,
    suggestion_service: SuggestionService = Depends(get_suggestion_service)
) -> AutocompleteResponse:
    suggestion = suggestion_service.generate(payload)
    return AutocompleteResponse(suggestion=suggestion)
