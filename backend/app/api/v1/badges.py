import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.badge import (
    BadgesResponse,
    CheckBadgesResponse,
    MarkBadgesSeenRequest,
    MarkBadgesSeenResponse,
    BadgeWithStatus,
)
from app.services.badge_service import (
    check_and_award_badges,
    get_all_badges_with_status,
    mark_badges_seen,
    get_badge_config,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=BadgesResponse)
def get_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    badges_list, total_earned, new_badge_ids = get_all_badges_with_status(current_user, db)
    
    return BadgesResponse(
        badges=[BadgeWithStatus(**b) for b in badges_list],
        total_earned=total_earned,
        total_badges=len(badges_list),
        new_badges=new_badge_ids,
    )


@router.post("/check", response_model=CheckBadgesResponse)
def check_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_badges = check_and_award_badges(current_user, db)
    
    new_badges_response = []
    for badge in new_badges:
        config = get_badge_config(badge.badge_id)
        if config:
            new_badges_response.append(BadgeWithStatus(
                badge_id=badge.badge_id,
                emoji=config["emoji"],
                title=config["title"],
                description=config["description"],
                requirement=config["requirement"],
                color=config["color"],
                category=config["category"],
                is_earned=True,
                earned_at=badge.earned_at,
                seen=False,
            ))
    
    badges_list, total_earned, _ = get_all_badges_with_status(current_user, db)
    
    return CheckBadgesResponse(
        new_badges=new_badges_response,
        total_earned=total_earned,
    )


@router.post("/seen", response_model=MarkBadgesSeenResponse)
def mark_seen(
    request: MarkBadgesSeenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    marked_count = mark_badges_seen(current_user.id, request.badge_ids, db)
    
    return MarkBadgesSeenResponse(
        success=True,
        marked_count=marked_count,
    )


@router.get("/new", response_model=List[BadgeWithStatus])
def get_new_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    badges_list, _, new_badge_ids = get_all_badges_with_status(current_user, db)
    
    new_badges = [
        BadgeWithStatus(**b) for b in badges_list 
        if b["badge_id"] in new_badge_ids
    ]
    
    return new_badges

