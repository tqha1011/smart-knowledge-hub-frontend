import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearSession,
  DEMO_CHANGED_EVENT,
  getDemoSession,
} from "./authSession";
export function useDemoSession() {
  const [session, setSession] = useState(getDemoSession);
  const [now, setNow] = useState(Date.now);
  const navigate = useNavigate();
  useEffect(() => {
    const change = () => setSession(getDemoSession());
    window.addEventListener(DEMO_CHANGED_EVENT, change);
    const timer = window.setInterval(() => {
      setNow(Date.now());
      const current = getDemoSession();
      if (current && Date.parse(current.expiresAt) <= Date.now()) {
        clearSession();
        navigate("/login?demo=expired", { replace: true });
      }
    }, 1000);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(DEMO_CHANGED_EVENT, change);
    };
  }, [navigate]);
  const remainingSeconds = session
    ? Math.max(0, Math.ceil((Date.parse(session.expiresAt) - now) / 1000))
    : 0;
  const blocked = Boolean(
    session &&
    (!remainingSeconds ||
      session.remainingQuestions <= 0 ||
      session.dailyQuestionBudgetExhausted),
  );
  return { session, remainingSeconds, blocked };
}
