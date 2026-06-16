'use client';

export type AdScript = {
  hookOptions: [string, string, string];
  selectedHookIndex: number;
  body: string;
  cta: string;
};

export function createDefaultScript(productName: string): AdScript {
  const name = productName || 'this product';
  return {
    hookOptions: [
      `Stop scrolling — this ${name} is a game changer.`,
      `Nobody talks about this ${name} hack.`,
      `I wish I found this ${name} sooner.`,
    ],
    selectedHookIndex: 0,
    body: `This ${name} fixes your daily pain fast. Premium results, no premium price.`,
    cta: `Get 50% off today — link in bio before we sell out.`,
  };
}

export function getActiveHook(script: AdScript): string {
  return script.hookOptions[script.selectedHookIndex] || script.hookOptions[0];
}

type ScriptEditorProps = {
  script: AdScript;
  disabled?: boolean;
  onChange: (script: AdScript) => void;
};

export default function ScriptEditor({ script, disabled, onChange }: ScriptEditorProps) {
  const updateHookOption = (index: number, value: string) => {
    const hookOptions = [...script.hookOptions] as [string, string, string];
    hookOptions[index] = value;
    onChange({ ...script, hookOptions });
  };

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-violet-400">
              The Hook
            </div>
            <p className="text-[10px] text-gray-400 font-medium">First 3 seconds — pick one punchy opener</p>
          </div>
          <span className="text-[8px] font-mono text-gray-400 uppercase">3 options</span>
        </div>

        <div className="space-y-2">
          {script.hookOptions.map((option, index) => {
            const isSelected = script.selectedHookIndex === index;
            return (
              <div
                key={index}
                className={`rounded-xl border transition-all ${
                  isSelected
                    ? 'border-violet-500/50 bg-violet-600/20 text-white shadow-[0_0_16px_rgba(139,92,246,0.15)]'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-violet-500/25'
                }`}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...script, selectedHookIndex: index })}
                  className="w-full text-left px-3 pt-3 pb-1 flex items-center justify-between gap-2"
                >
                  <span className="text-[8px] font-mono font-bold uppercase tracking-widest opacity-70">
                    Hook {index + 1}
                  </span>
                  {isSelected && (
                    <span className="text-[8px] font-mono text-violet-300 uppercase">Selected</span>
                  )}
                </button>
                <textarea
                  value={option}
                  disabled={disabled}
                  onChange={(e) => updateHookOption(index, e.target.value)}
                  rows={2}
                  className={`w-full px-3 pb-3 bg-transparent text-xs font-semibold leading-relaxed resize-none focus:outline-none ${
                    isSelected ? 'text-white placeholder:text-white/40' : 'text-zinc-200 placeholder:text-zinc-500'
                  }`}
                  placeholder="Write a scroll-stopping hook..."
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <div>
          <div className="text-[9px] font-black uppercase tracking-widest text-violet-400">The Body</div>
          <p className="text-[10px] text-zinc-500 font-medium">Main product benefits &amp; proof</p>
        </div>
        <textarea
          value={script.body}
          disabled={disabled}
          onChange={(e) => onChange({ ...script, body: e.target.value })}
          rows={4}
          className="w-full p-3.5 rounded-xl dl-input text-xs font-medium leading-relaxed resize-none"
          placeholder="Explain why this product wins..."
        />
      </section>

      <section className="space-y-2">
        <div>
          <div className="text-[9px] font-black uppercase tracking-widest text-amber-600">The CTA</div>
          <p className="text-[10px] text-zinc-500 font-medium">Conversion closer with urgency</p>
        </div>
        <textarea
          value={script.cta}
          disabled={disabled}
          onChange={(e) => onChange({ ...script, cta: e.target.value })}
          rows={3}
          className="w-full p-3.5 rounded-xl dl-input text-xs font-bold leading-relaxed resize-none"
          placeholder="Get 50% off today only at..."
        />
      </section>
    </div>
  );
}
