'use client';
import { useState, useEffect } from 'react';
import { useTestStore } from '@/stores/testStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, Upload } from 'lucide-react';

export function InputSetManager() {
  const { inputSets, loadInputSets, createInputSet, removeInputSet } = useTestStore();
  const [name, setName] = useState('');
  const [inputsText, setInputsText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadInputSets();
  }, [loadInputSets]);

  const handleCreate = async () => {
    if (!name.trim() || !inputsText.trim()) return;
    const inputs = inputsText.split('\n').map((s) => s.trim()).filter(Boolean);
    if (inputs.length === 0) return;
    await createInputSet(name.trim(), inputs);
    setName('');
    setInputsText('');
    setIsCreating(false);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      setInputsText(text);
      if (!name.trim()) setName(file.name.replace(/\.\w+$/, ''));
      setIsCreating(true);
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Input Sets</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-3 w-3 mr-1" /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsCreating(!isCreating)}>
            <Plus className="h-3 w-3 mr-1" /> New
          </Button>
        </div>
      </div>

      {isCreating && (
        <Card className="p-3 space-y-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Input set name..."
          />
          <Textarea
            value={inputsText}
            onChange={(e) => setInputsText(e.target.value)}
            placeholder="One input per line..."
            rows={6}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate}>Create</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {inputSets.map((set) => (
          <Card key={set.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{set.name}</div>
              <div className="text-xs text-muted-foreground">{set.inputs.length} inputs</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeInputSet(set.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </Card>
        ))}
        {inputSets.length === 0 && !isCreating && (
          <p className="text-xs text-muted-foreground text-center py-4">No input sets yet</p>
        )}
      </div>
    </div>
  );
}
