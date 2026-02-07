import { Turnstile } from '@marsidev/react-turnstile';
import { useState } from 'react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

export default function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-2">
      <Turnstile
        siteKey={TURNSTILE_SITE_KEY}
        onSuccess={(token) => {
          setError(null);
          onVerify(token);
        }}
        onError={() => {
          setError('Verifikasi gagal. Silakan coba lagi.');
        }}
        onExpire={() => {
          onExpire?.();
          setError('Verifikasi expired. Silakan verifikasi ulang.');
        }}
        options={{
          theme: 'dark',
          size: 'normal',
        }}
      />
      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
    </div>
  );
}
