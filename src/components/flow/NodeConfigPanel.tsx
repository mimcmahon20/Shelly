'use client';
import { useFlowStore } from '@/stores/flowStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Trash2 } from 'lucide-react';
import type { RoutingRule } from '@/lib/types';

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
    <div className="w-80 border-l bg-card p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Configure Node</h3>
        <Button variant="ghost" size="icon" onClick={() => selectNode(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

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
              <Label>System Prompt</Label>
              <Textarea
                value={node.data.systemPrompt || ''}
                onChange={(e) => updateSystemPrompt(e.target.value)}
                rows={4}
                placeholder="You are a helpful assistant..."
              />
            </div>
            <div>
              <Label>Human Message Template</Label>
              <Textarea
                value={node.data.humanMessageTemplate || ''}
                onChange={(e) => updateHumanMessageTemplate(e.target.value)}
                rows={3}
                placeholder="Use {{input}} to reference incoming data"
              />
            </div>
          </>
        )}

        {node.type === 'structured-output' && (
          <>
            <Separator />
            <div>
              <Label>Output JSON Schema</Label>
              <Textarea
                value={node.data.outputSchema || ''}
                onChange={(e) => updateOutputSchema(e.target.value)}
                rows={6}
                placeholder='{"type": "object", "properties": {...}}'
                className="font-mono text-xs"
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
