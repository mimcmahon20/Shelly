'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound } from 'lucide-react';

export function ApiKeyInput() {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('shelly-api-key');
    if (stored) {
      setKey(stored);
      setSaved(true);
    }
  }, []);

  const save = () => {
    localStorage.setItem('shelly-api-key', key);
    setSaved(true);
  };

  const clear = () => {
    localStorage.removeItem('shelly-api-key');
    setKey('');
    setSaved(false);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <KeyRound className="h-3.5 w-3.5" />
        Anthropic API Key
      </Label>
      <div className="flex gap-2">
        <Input
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setSaved(false);
          }}
          placeholder="sk-ant-..."
          className="font-mono text-xs"
        />
        {saved ? (
          <Button variant="outline" size="sm" onClick={clear}>
            Clear
          </Button>
        ) : (
          <Button size="sm" onClick={save} disabled={!key}>
            Save
          </Button>
        )}
      </div>
      {saved && <p className="text-xs text-green-600">Key saved to localStorage</p>}
    </div>
  );
}
