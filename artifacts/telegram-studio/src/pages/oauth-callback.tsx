import { useEffect } from "react";

export default function OAuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    
    if (code) {
      if (window.opener) {
        window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', code }, '*');
        window.close();
      } else {
        // Fallback
        localStorage.setItem("oauth_code", code);
        window.location.href = "/settings";
      }
    } else {
      if (window.opener) {
        window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: "No code received" }, '*');
        window.close();
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center font-cairo">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-bold animate-pulse">جاري المصادقة... سيتم إغلاق هذه النافذة تلقائياً.</p>
      </div>
    </div>
  );
}
