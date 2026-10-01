import { useEffect, useState } from "react";
import {
  login,
  getRegistrationBatchYears,
  requestRegistrationOtp,
  completeRegistration,
  requestPasswordResetOtp,
  resetPassword,
} from "../api/auth";

// mode: 'login' | 'register' | 'forgot'
// registerStep: 'batch' -> 'details' -> 'otp'
function LoginPanel({ isOpen, onClose, onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [loginData, setLoginData] = useState({ rollNo: "", password: "" });

  const [batchYears, setBatchYears] = useState([]);
  const [registerStep, setRegisterStep] = useState("batch");
  const [registerData, setRegisterData] = useState({
    batchYear: "",
    name: "",
    rollNo: "",
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const [forgotStep, setForgotStep] = useState("request"); // 'request' -> 'reset'
  const [forgotData, setForgotData] = useState({ email: "", otp: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    if (mode === "register" && registerStep === "batch" && batchYears.length === 0) {
      getRegistrationBatchYears()
        .then(setBatchYears)
        .catch((e) => setMessage(e.message));
    }
  }, [mode, registerStep, batchYears.length]);

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginData((p) => ({ ...p, [name]: value }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterData((p) => ({ ...p, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      const user = await login(loginData.rollNo.trim(), loginData.password);
      onLogin(user);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };

  // Step 1: pick batch year (only years already on the roster show up)
  const handlePickBatch = (event) => {
    event.preventDefault();
    if (!registerData.batchYear) {
      setMessage("Please select your batch year.");
      return;
    }
    setMessage("");
    setRegisterStep("details");
  };

  // Step 2: enter name/roll/email -> must match roster -> OTP sent
  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      await requestRegistrationOtp({
        batchYear: Number(registerData.batchYear),
        name: registerData.name.trim(),
        rollNo: registerData.rollNo.trim(),
        email: registerData.email.trim(),
      });
      setRegisterStep("otp");
      setMessage("An OTP has been sent to your IITG email.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };

  // Step 3: OTP + password -> account created
  const handleCompleteRegistration = async (event) => {
    event.preventDefault();
    setMessage("");

    if (registerData.password !== registerData.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (registerData.password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const user = await completeRegistration({
        batchYear: Number(registerData.batchYear),
        name: registerData.name.trim(),
        rollNo: registerData.rollNo.trim(),
        email: registerData.email.trim(),
        otp: registerData.otp.trim(),
        password: registerData.password,
      });
      if (onRegister) onRegister(user);
      setMode("login");
      setRegisterStep("batch");
      setMessage("Registration successful. You can now log in.");
      setRegisterData({
        batchYear: "", name: "", rollNo: "", email: "", otp: "", password: "", confirmPassword: "",
      });
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleForgotRequestOtp = async (event) => {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      await requestPasswordResetOtp(forgotData.email.trim());
      setForgotStep("reset");
      setMessage("If this email is registered, an OTP has been sent.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleForgotReset = async (event) => {
    event.preventDefault();
    setMessage("");
    if (forgotData.newPassword !== forgotData.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword({
        email: forgotData.email.trim(),
        otp: forgotData.otp.trim(),
        newPassword: forgotData.newPassword,
      });
      setMode("login");
      setForgotStep("request");
      setMessage("Password reset. You can now log in.");
      setForgotData({ email: "", otp: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (nextMode) => {
    setMessage("");
    setMode(nextMode);
    if (nextMode === "register") setRegisterStep("batch");
    if (nextMode === "forgot") setForgotStep("request");
  };

  return (
    <>
      <div className={`login-overlay ${isOpen ? "show" : ""}`} onClick={onClose} />

      <aside className={`login-panel ${isOpen ? "open" : ""}`}>
        <button className="close-login" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="login-content">
          <div className="login-icon">B</div>

          {mode === "login" && (
            <>
              <h2>Welcome Back</h2>
              <p className="login-subtitle">Sign in to access the yearbook</p>

              <form onSubmit={handleLogin}>
                <label htmlFor="login-roll">Roll Number</label>
                <input
                  id="login-roll"
                  type="text"
                  name="rollNo"
                  placeholder="Your roll number"
                  value={loginData.rollNo}
                  onChange={handleLoginChange}
                  required
                />

                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />

                {message && <p className="auth-message">{message}</p>}

                <button type="submit" className="login-submit" disabled={busy}>
                  {busy ? "Signing in..." : "Log In"}
                </button>
              </form>

              <p className="auth-switch">
                New to the yearbook?{" "}
                <button type="button" onClick={() => switchMode("register")}>
                  Register
                </button>
              </p>
              <p className="auth-switch">
                <button type="button" onClick={() => switchMode("forgot")}>
                  Forgot password?
                </button>
              </p>
            </>
          )}

          {mode === "register" && registerStep === "batch" && (
            <>
              <h2>Create Account</h2>
              <p className="login-subtitle">First, select your batch year</p>

              <form onSubmit={handlePickBatch}>
                <label htmlFor="register-batch">Batch Year</label>
                <select
                  id="register-batch"
                  name="batchYear"
                  value={registerData.batchYear}
                  onChange={handleRegisterChange}
                  required
                >
                  <option value="" disabled>
                    Select your batch year
                  </option>
                  {batchYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                {message && <p className="auth-message">{message}</p>}

                <button type="submit" className="login-submit">
                  Continue
                </button>
              </form>

              <p className="auth-switch">
                Already registered?{" "}
                <button type="button" onClick={() => switchMode("login")}>
                  Log In
                </button>
              </p>
            </>
          )}

          {mode === "register" && registerStep === "details" && (
            <>
              <h2>Create Account</h2>
              <p className="login-subtitle">
                Batch {registerData.batchYear} — enter your details exactly as on the roster
              </p>

              <form onSubmit={handleRequestOtp}>
                <label htmlFor="register-name">Full Name</label>
                <input
                  id="register-name"
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  required
                />

                <label htmlFor="register-roll">Roll Number</label>
                <input
                  id="register-roll"
                  type="text"
                  name="rollNo"
                  placeholder="Your roll number"
                  value={registerData.rollNo}
                  onChange={handleRegisterChange}
                  required
                />

                <label htmlFor="register-email">IITG Email ID</label>
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  placeholder="yourname@iitg.ac.in"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  required
                />

                {message && <p className="auth-message">{message}</p>}

                <button type="submit" className="login-submit" disabled={busy}>
                  {busy ? "Checking..." : "Send OTP"}
                </button>
              </form>

              <p className="auth-switch">
                <button type="button" onClick={() => setRegisterStep("batch")}>
                  ← Change batch year
                </button>
              </p>
            </>
          )}

          {mode === "register" && registerStep === "otp" && (
            <>
              <h2>Verify Email</h2>
              <p className="login-subtitle">Enter the OTP sent to {registerData.email}</p>

              <form onSubmit={handleCompleteRegistration}>
                <label htmlFor="register-otp">OTP</label>
                <input
                  id="register-otp"
                  type="text"
                  name="otp"
                  placeholder="6-digit code"
                  value={registerData.otp}
                  onChange={handleRegisterChange}
                  required
                />

                <label htmlFor="register-password">Password</label>
                <input
                  id="register-password"
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  required
                />

                <label htmlFor="register-confirm-password">Confirm Password</label>
                <input
                  id="register-confirm-password"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  required
                />

                {message && <p className="auth-message">{message}</p>}

                <button type="submit" className="login-submit" disabled={busy}>
                  {busy ? "Verifying..." : "Verify & Register"}
                </button>
              </form>

              <p className="auth-switch">
                <button type="button" onClick={() => setRegisterStep("details")}>
                  ← Edit details
                </button>
              </p>
            </>
          )}

          {mode === "forgot" && forgotStep === "request" && (
            <>
              <h2>Forgot Password</h2>
              <p className="login-subtitle">Enter your registered email</p>

              <form onSubmit={handleForgotRequestOtp}>
                <label htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  name="email"
                  placeholder="yourname@iitg.ac.in"
                  value={forgotData.email}
                  onChange={(e) => setForgotData((p) => ({ ...p, email: e.target.value }))}
                  required
                />

                {message && <p className="auth-message">{message}</p>}

                <button type="submit" className="login-submit" disabled={busy}>
                  {busy ? "Sending..." : "Send OTP"}
                </button>
              </form>

              <p className="auth-switch">
                <button type="button" onClick={() => switchMode("login")}>
                  ← Back to login
                </button>
              </p>
            </>
          )}

          {mode === "forgot" && forgotStep === "reset" && (
            <>
              <h2>Reset Password</h2>
              <p className="login-subtitle">Enter the OTP and your new password</p>

              <form onSubmit={handleForgotReset}>
                <label htmlFor="forgot-otp">OTP</label>
                <input
                  id="forgot-otp"
                  type="text"
                  placeholder="6-digit code"
                  value={forgotData.otp}
                  onChange={(e) => setForgotData((p) => ({ ...p, otp: e.target.value }))}
                  required
                />

                <label htmlFor="forgot-new-password">New Password</label>
                <input
                  id="forgot-new-password"
                  type="password"
                  placeholder="New password"
                  value={forgotData.newPassword}
                  onChange={(e) => setForgotData((p) => ({ ...p, newPassword: e.target.value }))}
                  required
                />

                <label htmlFor="forgot-confirm-password">Confirm Password</label>
                <input
                  id="forgot-confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={forgotData.confirmPassword}
                  onChange={(e) => setForgotData((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                />

                {message && <p className="auth-message">{message}</p>}

                <button type="submit" className="login-submit" disabled={busy}>
                  {busy ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

export default LoginPanel;
