'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { KeyRound } from 'lucide-react';

interface ProviderKeyConfig {
  storageKey: string;
  label: string;
  placeholder: string;
}

const PROVIDER_KEYS: ProviderKeyConfig[] = [
  { storageKey: 'shelly-api-key-anthropic', label: 'Anthropic API Key', placeholder: 'sk-ant-...' },
  { storageKey: 'shelly-api-key-openai', label: 'OpenAI API Key', placeholder: 'sk-...' },
  {
    storageKey: 'shelly-api-key-google-vertex',
    label: 'Google Vertex (Project:Location)',
    placeholder: 'my-project:us-central1',
  },
];

function SingleKeyInput({ config }: { config: ProviderKeyConfig }) {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(config.storageKey);
    if (stored) {
      setKey(stored);
      setSaved(true);
    }
  }, [config.storageKey]);

  const save = () => {
    localStorage.setItem(config.storageKey, key);
    setSaved(true);
  };

  const clear = () => {
    localStorage.removeItem(config.storageKey);
    setKey('');
    setSaved(false);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <KeyRound className="h-3.5 w-3.5" />
        {config.label}
      </Label>
      <div className="flex gap-2">
        <Input
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setSaved(false);
          }}
          placeholder={config.placeholder}
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
      {saved && <p className="text-xs text-green-600 dark:text-green-400">Saved</p>}
    </div>
  );
}

export function ApiKeyInput() {
  return (
    <div className="space-y-4">
      {PROVIDER_KEYS.map((config, i) => (
        <div key={config.storageKey}>
          {i > 0 && <Separator className="mb-4" />}
          <SingleKeyInput config={config} />
        </div>
      ))}
    </div>
  );
}
