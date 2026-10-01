from datetime import datetime
from sqlalchemy import Column, DateTime, BigInteger, Boolean


class AuditSoftDeleteMixin:
    """Applied to every table per project convention:
    created_at, updated_at, created_by, updated_by + soft delete.
    """
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(BigInteger, nullable=True)
    updated_by = Column(BigInteger, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
