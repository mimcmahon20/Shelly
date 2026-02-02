'use client';
import { useState, useEffect } from 'react';
import { useTestStore } from '@/stores/testStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, Upload, X } from 'lucide-react';
import type { InputValue } from '@/lib/types';

export function InputSetManager() {
  const { inputSets, loadInputSets, createInputSet, removeInputSet } = useTestStore();
  const [name, setName] = useState('');
  const [inputsText, setInputsText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [inputMode, setInputMode] = useState<'simple' | 'structured'>('simple');
  const [fields, setFields] = useState<string[]>(['field1']);
  const [rows, setRows] = useState<Record<string, string>[]>([{}]);

  useEffect(() => {
    loadInputSets();
  }, [loadInputSets]);

  const handleCreate = async () => {
    if (!name.trim()) return;

    if (inputMode === 'simple') {
      const inputs = inputsText.split('\n').map((s) => s.trim()).filter(Boolean);
      if (inputs.length === 0) return;
      await createInputSet(name.trim(), inputs, 'simple');
    } else {
      const validFields = fields.filter((f) => f.trim());
      if (validFields.length === 0) return;
      const inputs: InputValue[] = rows
        .filter((row) => validFields.some((f) => row[f]?.trim()))
        .map((row) => {
          const obj: Record<string, string> = {};
          for (const f of validFields) obj[f] = row[f] ?? '';
          return obj;
        });
      if (inputs.length === 0) return;
      await createInputSet(name.trim(), inputs, 'structured', validFields);
    }

    setName('');
    setInputsText('');
    setFields(['field1']);
    setRows([{}]);
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
      if (!name.trim()) setName(file.name.replace(/\.\w+$/, ''));
      setIsCreating(true);

      // Detect CSV with header row
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length >= 2 && lines[0].includes(',')) {
        const headers = parseCSVRow(lines[0]);
        if (headers.every((h) => /^\w+$/.test(h))) {
          setInputMode('structured');
          setFields(headers);
          const parsed = lines.slice(1).map((line) => {
            const values = parseCSVRow(line);
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
            return obj;
          });
          setRows(parsed);
          return;
        }
      }

      setInputMode('simple');
      setInputsText(text);
    };
    input.click();
  };

  const addField = () => {
    setFields([...fields, '']);
  };

  const removeField = (index: number) => {
    const f = fields[index];
    setFields(fields.filter((_, i) => i !== index));
    setRows(rows.map((row) => {
      const next = { ...row };
      delete next[f];
      return next;
    }));
  };

  const updateFieldName = (index: number, newName: string) => {
    const oldName = fields[index];
    const sanitized = newName.replace(/[^\w]/g, '');
    setFields(fields.map((f, i) => (i === index ? sanitized : f)));
    if (oldName && sanitized !== oldName) {
      setRows(rows.map((row) => {
        const next = { ...row };
        next[sanitized] = next[oldName] ?? '';
        delete next[oldName];
        return next;
      }));
    }
  };

  const updateCell = (rowIndex: number, field: string, value: string) => {
    setRows(rows.map((row, i) => (i === rowIndex ? { ...row, [field]: value } : row)));
  };

  const addRow = () => setRows([...rows, {}]);
  const removeRow = (index: number) => setRows(rows.filter((_, i) => i !== index));

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

          {/* Mode toggle */}
          <div className="flex gap-1">
            <Button
              variant={inputMode === 'simple' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMode('simple')}
            >
              Simple
            </Button>
            <Button
              variant={inputMode === 'structured' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMode('structured')}
            >
              Structured
            </Button>
          </div>

          {inputMode === 'simple' ? (
            <Textarea
              value={inputsText}
              onChange={(e) => setInputsText(e.target.value)}
              placeholder="One input per line..."
              rows={6}
            />
          ) : (
            <div className="space-y-2">
              {/* Field names */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-muted-foreground">Fields:</span>
                {fields.map((field, i) => (
                  <div key={i} className="flex items-center gap-0.5">
                    <Input
                      value={field}
                      onChange={(e) => updateFieldName(i, e.target.value)}
                      placeholder="field"
                      className="h-7 w-24 text-xs"
                    />
                    {fields.length > 1 && (
                      <button onClick={() => removeField(i)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="h-7 px-1" onClick={addField}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Table */}
              <div className="border rounded overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-1 text-left w-8">#</th>
                      {fields.filter((f) => f.trim()).map((f) => (
                        <th key={f} className="p-1 text-left">{f}</th>
                      ))}
                      <th className="p-1 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={ri} className="border-t">
                        <td className="p-1 text-muted-foreground">{ri + 1}</td>
                        {fields.filter((f) => f.trim()).map((f) => (
                          <td key={f} className="p-1">
                            <Input
                              value={row[f] ?? ''}
                              onChange={(e) => updateCell(ri, f, e.target.value)}
                              className="h-7 text-xs"
                            />
                          </td>
                        ))}
                        <td className="p-1">
                          {rows.length > 1 && (
                            <button onClick={() => removeRow(ri)} className="text-muted-foreground hover:text-foreground">
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="h-3 w-3 mr-1" /> Add Row
              </Button>
            </div>
          )}

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
              <div className="text-xs text-muted-foreground">
                {set.inputs.length} inputs
                {(set.inputMode ?? 'simple') === 'structured' && set.fields && (
                  <> &middot; {set.fields.join(', ')}</>
                )}
              </div>
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

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}
