from datetime import datetime


def get_batch_tag(batch_year: int, current_year: int | None = None) -> str:
    """
    current_year=2026:
      2026 -> 'Fresher'
      2025 -> 'Graduating'
      2024 -> 'Recently Graduated'
      else -> str(year)
    """
    current_year = current_year or datetime.utcnow().year
    if batch_year == current_year:
        return "Fresher"
    if batch_year == current_year - 1:
        return "Graduating"
    if batch_year == current_year - 2:
        return "Recently Graduated"
    return str(batch_year)


def get_default_selected_batch(current_year: int | None = None) -> int:
    """Graduating batch is the default selection on the home page."""
    current_year = current_year or datetime.utcnow().year
    return current_year - 1
