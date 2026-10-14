import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDemoSession } from "../../shared/useDemoSession";
import { clearSession } from "../../shared/authSession";
import { demoService } from "../../services/demoService";
import { disconnectRealtime } from "../../services/realtimeService";
export function DemoBanner() {
  const { session, remainingSeconds } = useDemoSession();
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const token = session?.accessToken;
  const [statusRevision, setStatusRevision] = useState(0);
  useEffect(() => {
    if (token)
      void demoService
        .syncStatus()
        .then(() => setError(false))
        .catch(() => setError(true));
  }, [token, statusRevision]);
  const resetAt = session?.resetAt;
  const exhausted = session?.dailyQuestionBudgetExhausted;
  useEffect(() => {
    if (!token || !exhausted || !resetAt) return;
    const delay = Date.parse(resetAt) - Date.now();
    if (!Number.isFinite(delay)) return;
    const timer = window.setTimeout(
      () => {
        void demoService
          .syncStatus()
          .then(() => setError(false))
          .catch(() => setError(true));
      },
      Math.max(0, delay) + 50,
    );
    return () => window.clearTimeout(timer);
  }, [token, exhausted, resetAt]);
  if (!session) return null;
  const leave = async () => {
    setLeaving(true);
    try {
      await demoService.revoke();
    } catch {
      /* Expiry or offline: clear the local token regardless. */
    } finally {
      disconnectRealtime();
      clearSession();
      navigate("/login", { replace: true });
    }
  };
  return (
    <div
      role="status"
      className="bg-accent-soft text-accent flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs"
    >
      <span>
        Bản demo · Dữ liệu giả lập · Còn {Math.ceil(remainingSeconds / 60)} phút
        · {session.remainingQuestions} câu
        {session.dailyQuestionBudgetExhausted
          ? " · Hết lượt dùng chung hôm nay; vẫn xem tài liệu được."
          : ""}
        {error ? " · Chưa tải được trạng thái." : ""}
      </span>
      {error && (
        <button
          type="button"
          onClick={() => setStatusRevision((value) => value + 1)}
          className="underline"
        >
          Thử tải trạng thái lại
        </button>
      )}
      <button
        type="button"
        disabled={leaving}
        onClick={() => void leave()}
        className="font-semibold underline disabled:opacity-60"
      >
        {leaving ? "Đang thoát…" : "Thoát demo"}
      </button>
    </div>
  );
}
