import smtplib
from email.mime.text import MIMEText
import logging

from app.core.config import settings

logger = logging.getLogger("yearbook.mailer")
 

def send_mail(to_email: str, subject: str, body: str) -> None:
    """Sends mail via SMTP if MAIL_ENABLED, otherwise logs to console.

    NOTE: no SMTP provider has been configured for this project yet.
    Set MAIL_ENABLED=true and the SMTP_* vars in .env once you have
    IITG's mail relay (or Gmail/SES/SendGrid) credentials — nothing else
    in the app needs to change.
    """
    if not settings.MAIL_ENABLED:
        logger.info("[DEV MAIL STUB] To=%s Subject=%s\n%s", to_email, subject, body)
        print(f"[DEV MAIL STUB] To={to_email} Subject={subject}\n{body}")
        return

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to_email

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.MAIL_FROM, [to_email], msg.as_string())


def send_otp_mail(to_email: str, otp: str, purpose: str) -> None:
    if purpose == "registration":
        subject = "Verify your email — Physics Yearbook IITG"
        body = f"Your registration OTP is {otp}. It expires in {settings.OTP_EXPIRE_MINUTES} minutes."
    else:
        subject = "Password reset OTP — Physics Yearbook IITG"
        body = f"Your password reset OTP is {otp}. It expires in {settings.OTP_EXPIRE_MINUTES} minutes."
    send_mail(to_email, subject, body)


def send_notification_mail(to_email: str, message: str) -> None:
    send_mail(to_email, "Physics Yearbook IITG — Update", message)
