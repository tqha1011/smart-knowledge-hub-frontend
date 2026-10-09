import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { demoService } from "../../services/demoService";
import { disconnectRealtime } from "../../services/realtimeService";
import { setDemoSession } from "../../shared/authSession";
import { toErrorMessage } from "../../shared/handleApiError";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";
import type { DemoConfig } from "../../types/authType/demo";
export function DemoEntry() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<DemoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    demoService
      .config(abort.signal)
      .then((value) => {
        if (!abort.signal.aborted) setConfig(value);
      })
      .catch((reason) => {
        if (!abort.signal.aborted)
          setError(toErrorMessage(reason as ApiErrorResponse));
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [revision]);
  useEffect(() => {
    if (!loading && !starting) return;
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => {
      window.clearTimeout(timer);
      setSlow(false);
    };
  }, [loading, starting]);
  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const result = await demoService.start();
      disconnectRealtime();
      setDemoSession({
        ...result,
        sampleQuestions: config?.sampleQuestions ?? [],
      });
      navigate(`/spaces/${result.knowledgeSpacePublicId}`, { replace: true });
    } catch (reason) {
      setError(toErrorMessage(reason as ApiErrorResponse));
    } finally {
      setStarting(false);
    }
  };
  if (!loading && !error && !config?.enabled) return null;
  return (
    <div className="border-border mt-5 border-t pt-4">
      <p className="text-ink mb-1 text-sm font-semibold">Khám phá bản demo</p>
      <p className="text-ink-muted mb-3 text-xs">
        Dữ liệu giả lập · Không cần đăng ký · {config?.questionLimit ?? 20} câu
        / {Math.round((config?.durationSeconds ?? 3600) / 60)} phút
      </p>
      {error && (
        <p role="alert" className="text-warn-fg mb-2 text-sm">
          {error}
        </p>
      )}
      {slow && (
        <p role="status" className="text-ink-muted mb-2 text-xs">
          Đang khởi động bản demo. Lần truy cập đầu có thể mất khoảng một phút.
        </p>
      )}
      {error && !config ? (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLoading(true);
            setRevision((value) => value + 1);
          }}
          className="text-accent text-sm"
        >
          Thử tải bản demo lại
        </button>
      ) : (
        <button
          type="button"
          disabled={loading || starting || !config?.enabled}
          onClick={() => void start()}
          className="bg-accent-soft text-accent w-full rounded-md px-3 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {loading
            ? "Đang kiểm tra bản demo…"
            : starting
              ? "Đang vào bản demo…"
              : "Vào bản demo"}
        </button>
      )}
    </div>
  );
}
