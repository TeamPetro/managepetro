from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.llm_service import LLMService
from typing import Optional


router = APIRouter(prefix="/api/v1", tags=["Optimization"])

class Input(BaseModel):
    from_location: str = Field(..., description="Start location")
    to_location: str = Field(..., description="Start location")
    delivery_date: Optional[str] = Field(None, description="delivery date")
    vehicle_type: Optional[str] = Field("truck", description="vehicle type")
    notes: Optional[str] = Field(None, description="Additional constraints")

llm_service = LLMService()

@router.post("/input")
async def optimize_route(data: Input):

    try: 

        result = await llm_service.optimize_route(
             from_location=data.from_location,
             to_location=data.to_location,
             delivery_date=data.delivery_date,
             vehicle_type=data.vehicle_type,
             notes=data.notes

        )

        return(result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))