from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Room(Base):
    __tablename__ = 'rooms'

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    language: Mapped[str] = mapped_column(String(32), default='python')
    code: Mapped[str] = mapped_column(Text, default='# Start collaborating...\n')
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    last_author: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    def snapshot(self) -> dict[str, Optional[str]]:
        return {
            'roomId': self.id,
            'language': self.language,
            'code': self.code,
            'lastAuthor': self.last_author,
            'updatedAt': self.updated_at.isoformat()
        }
