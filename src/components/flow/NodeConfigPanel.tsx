'use client';
import { useState } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Maximize2 } from 'lucide-react';
import type { RoutingRule, ProviderName } from '@/lib/types';
import { PROVIDERS } from '@/lib/llm/providers';

function ExpandableTextarea({
  label, value, onChange, placeholder, rows, mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const cls = mono ? 'font-mono text-xs' : '';
  return (
    <>
      <div className="flex items-center justify-between mb-1.5">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Expand"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={cls}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl flex flex-col h-[70vh]">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`flex-1 resize-none ${cls}`}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function NodeConfigPanel() {
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const flow = useFlowStore((s) => s.getCurrentFlow());
  const updateNode = useFlowStore((s) => s.updateNode);
  const removeNode = useFlowStore((s) => s.removeNode);
  const selectNode = useFlowStore((s) => s.selectNode);

  const node = flow?.nodes.find((n) => n.id === selectedNodeId);

  if (!node) return null;

  const updateLabel = (label: string) => updateNode(node.id, { label });
  const updateSystemPrompt = (systemPrompt: string) => updateNode(node.id, { systemPrompt });
  const updateHumanMessageTemplate = (humanMessageTemplate: string) =>
    updateNode(node.id, { humanMessageTemplate });
  const updateOutputSchema = (outputSchema: string) => updateNode(node.id, { outputSchema });

  const addRoutingRule = () => {
    const rules = [...(node.data.routingRules || [])];
    rules.push({ field: '', operator: 'equals', value: '', targetNodeId: '' });
    updateNode(node.id, { routingRules: rules });
  };

  const updateRoutingRule = (index: number, updates: Partial<RoutingRule>) => {
    const rules = [...(node.data.routingRules || [])];
    rules[index] = { ...rules[index], ...updates };
    updateNode(node.id, { routingRules: rules });
  };

  const removeRoutingRule = (index: number) => {
    const rules = (node.data.routingRules || []).filter((_, i) => i !== index);
    updateNode(node.id, { routingRules: rules });
  };

  const availableTargets = flow?.nodes.filter((n) => n.id !== node.id) || [];

  return (
    <div className="p-4 overflow-y-auto">
      <div className="space-y-4">
        <div>
          <Label>Label</Label>
          <Input value={node.data.label || ''} onChange={(e) => updateLabel(e.target.value)} />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Type: {node.type}</Label>
        </div>

        {(node.type === 'agent' || node.type === 'structured-output') && (
          <>
            <Separator />
            <div>
              <Label>Provider</Label>
              <Select
                value={node.data.provider || 'anthropic'}
                onValueChange={(v) => {
                  const newProvider = v as ProviderName;
                  const models = PROVIDERS[newProvider]?.models || [];
                  updateNode(node.id, { provider: newProvider, model: models[0] || '' });
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROVIDERS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Model</Label>
              <Select
                value={node.data.model || PROVIDERS[node.data.provider || 'anthropic']?.models[0] || ''}
                onValueChange={(v) => updateNode(node.id, { model: v })}
              >
                <SelectTrigger className="text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(PROVIDERS[node.data.provider || 'anthropic']?.models || []).map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <ExpandableTextarea
                label="System Prompt"
                value={node.data.systemPrompt || ''}
                onChange={updateSystemPrompt}
                placeholder="You are a helpful assistant..."
                rows={4}
              />
            </div>
            <div>
              <ExpandableTextarea
                label="Human Message Template"
                value={node.data.humanMessageTemplate || ''}
                onChange={updateHumanMessageTemplate}
                placeholder="Use {{input}} to reference incoming data"
                rows={3}
              />
            </div>
            <div>
              <Label>Max Output Tokens</Label>
              <Input
                type="number"
                min={1}
                value={node.data.maxOutputTokens ?? ''}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  updateNode(node.id, { maxOutputTokens: isNaN(v) ? undefined : v });
                }}
                placeholder="Default (64k)"
                className="w-32"
              />
            </div>
          </>
        )}

        {node.type === 'agent' && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Enable Tools (VFS)</Label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!node.data.toolsEnabled}
                  onClick={() => updateNode(node.id, { toolsEnabled: !node.data.toolsEnabled })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${node.data.toolsEnabled ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${node.data.toolsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              {node.data.toolsEnabled && (
                <div>
                  <Label>Max Tool Iterations</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={node.data.maxToolIterations ?? 10}
                    onChange={(e) => updateNode(node.id, { maxToolIterations: parseInt(e.target.value) || 10 })}
                    className="w-20"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {node.type === 'structured-output' && (
          <>
            <Separator />
            <div>
              <ExpandableTextarea
                label="Output JSON Schema"
                value={node.data.outputSchema || ''}
                onChange={updateOutputSchema}
                placeholder='{"type": "object", "properties": {...}}'
                rows={6}
                mono
              />
            </div>
          </>
        )}

        {node.type === 'router' && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Routing Rules</Label>
                <Button variant="ghost" size="sm" onClick={addRoutingRule}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {(node.data.routingRules || []).map((rule, i) => (
                <div key={i} className="border rounded p-2 mb-2 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="field"
                      value={rule.field}
                      onChange={(e) => updateRoutingRule(i, { field: e.target.value })}
                      className="text-xs"
                    />
                    <Select
                      value={rule.operator}
                      onValueChange={(v) => updateRoutingRule(i, { operator: v as RoutingRule['operator'] })}
                    >
                      <SelectTrigger className="w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">equals</SelectItem>
                        <SelectItem value="contains">contains</SelectItem>
                        <SelectItem value="gt">{'>'}</SelectItem>
                        <SelectItem value="lt">{'<'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="value"
                    value={rule.value}
                    onChange={(e) => updateRoutingRule(i, { value: e.target.value })}
                    className="text-xs"
                  />
                  <div className="flex gap-2">
                    <Select
                      value={rule.targetNodeId}
                      onValueChange={(v) => updateRoutingRule(i, { targetNodeId: v })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Target node" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTargets.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.data.label || t.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => removeRoutingRule(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <div>
                <Label className="text-xs">Default Target</Label>
                <Select
                  value={node.data.defaultTargetNodeId || ''}
                  onValueChange={(v) => updateNode(node.id, { defaultTargetNodeId: v })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Default target" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTargets.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.data.label || t.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        <Separator />
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => {
            removeNode(node.id);
            selectNode(null);
          }}
        >
          <Trash2 className="h-3 w-3 mr-1" /> Delete Node
        </Button>
      </div>
    </div>
  );
}
