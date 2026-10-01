"""Single place for OTP behaviour and user-facing OTP messages.

Change the values in this file when you want to adjust OTP behaviour.
Environment variables still override the expiry/attempt settings in Settings.
"""

OTP_LENGTH = 6

REGISTRATION_SUBJECT = "Verify your email — Physics Yearbook IITG"
PASSWORD_RESET_SUBJECT = "Password reset OTP — Physics Yearbook IITG"

REGISTRATION_MESSAGE = (
    "Your registration OTP is {otp}. "
    "It expires in {minutes} minutes."
)
PASSWORD_RESET_MESSAGE = (
    "Your password reset OTP is {otp}. "
    "It expires in {minutes} minutes."
)

NOTIFICATION_SUBJECT = "Physics Yearbook IITG — Update"


def build_otp_message(purpose: str, otp: str, minutes: int) -> tuple[str, str]:
    if purpose == "registration":
        return REGISTRATION_SUBJECT, REGISTRATION_MESSAGE.format(otp=otp, minutes=minutes)
    if purpose == "password_reset":
        return PASSWORD_RESET_SUBJECT, PASSWORD_RESET_MESSAGE.format(otp=otp, minutes=minutes)
    raise ValueError(f"Unsupported OTP purpose: {purpose}")
