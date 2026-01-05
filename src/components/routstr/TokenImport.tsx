'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle, Upload } from 'lucide-react';

interface TokenImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (token: string) => void;
}

export function TokenImport({ open, onOpenChange, onSuccess }: TokenImportProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImport = async () => {
    if (!token.trim()) {
      setError('Token is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate and save token directly using client-side function
      const { saveCashuToken, validateCashuToken } = await import('@/lib/routstr/token');
      
      const trimmedToken = token.trim();
      
      if (!validateCashuToken(trimmedToken)) {
        throw new Error('Invalid Cashu token format. Token should start with "cashu"');
      }
      
      await saveCashuToken(trimmedToken);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess(trimmedToken);
        onOpenChange(false);
        setToken('');
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/20 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Cashu Token</DialogTitle>
          <DialogDescription className="text-white/60">
            Paste your Cashu token string to import it into the app
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Token String</Label>
            <Textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="bg-black border-white/20 text-white font-mono text-xs min-h-[120px]"
              placeholder="cashuBo2Ftdmh0dHBzOi8vbWludC5jb2lub3MuaW9hdWNzYXRhdIGiYWlIAE963yoENWxhcIGjYWEZAgBhc3hAOWIwMzcyYjBlOGIyZTA0NWMxZDM1YTM0NjY4ODBiOGZjM2I5YmY0YWUxMGE3YmI1NTJkMDMxNzBiM2VlMGM2ZmFjWCECeWWqrx3yV5rEMQtUiloJj9mfMUBSaFyynCfxB3BAYqOiYWlIAHMRqi-ljMhhcJGkYWEYgGFzeEA5NjJlNzdjMjAyZDY1MGJiY2U4NmRlZmYxNmMwZDYzNjZjOWI5YWViNjJmYzRmYTQyMGM3NmUyYTI3YmQ3NGJmYWNYIQLheMlUjz1Y48d-Gr7Vv5X6vnr5eO4LtvAJsCR5iXKARGFko2FlWCBD4mHYoB-7-Zbdcp-EfYRKzguMnak-uBOwkRKC_0hhYWFzWCCdYjlnskVeaoGL5f_43-uTt8pIwM6HBLcqufJnMksA2mFyWCC2fdAw9XinnE-WUULkqiLQk2Bh5SLfGuIQbv-C2pMYB6RhYRhAYXN4QGRmNDExNTRmOWVlYTE0MzExMDM4NmJkY2Y5N2M2ZDBjNGU5YmZhZDViYzE0M2UxODg0ZTQ1NzUyOTlmYzEwMTJhY1ghA98Z-wC-jM0D2JLOd8KI-IbW33s9gRa1ZC3gihs70tL9YWSjYWVYIAHFCXzrVTiAm15r-9xKcUIcUxWNJ3W7S7cvCUAv4zpsYXNYIBDoPiiW4n7yunf89mI8Y-mMEn7M-zNOEt1yAgrdlzN6YXJYIHL3mu25V7FjG9..."
            />
            <div className="text-xs text-white/60">
              Paste the full Cashu token string (starts with "cashu")
            </div>
          </div>

          {error && (
            <div className="p-3 rounded bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Token imported successfully!</span>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-black border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || !token.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Token
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
