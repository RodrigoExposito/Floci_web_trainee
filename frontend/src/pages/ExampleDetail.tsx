import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Check, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { loadExample } from "@/lib/curriculum-loader";
import type { Example, ExampleBlock } from "@/lib/types";

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full"
          style={{ background: i <= level ? "var(--accent)" : "var(--border-focus)" }}
        />
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <button
      onClick={() => void handleCopy()}
      className="btn btn-ghost btn-sm flex items-center gap-1"
      style={{ fontSize: 11 }}
      title="Copiar código"
    >
      {copied ? (
        <>
          <Check className="size-3" style={{ color: "var(--accent)" }} />
          <span style={{ color: "var(--accent)" }}>Copiado</span>
        </>
      ) : (
        <>
          <Copy className="size-3" />
          <span>Copiar</span>
        </>
      )}
    </button>
  );
}

function TextBlock({ block }: { block: ExampleBlock }) {
  return (
    <div className="prose-content" style={{ marginBottom: 0 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {block.content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ block }: { block: ExampleBlock }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-tertiary)",
            }}
          >
            {block.language ?? "code"}
          </span>
          {block.caption && (
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>— {block.caption}</span>
          )}
        </div>
        <CopyButton text={block.content} />
      </div>
      <pre style={{ margin: 0, padding: "14px 16px", background: "var(--bg-surface)", overflowX: "auto" }}>
        <code
          className={`language-${block.language ?? "text"}`}
          style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.65 }}
        >
          {block.content}
        </code>
      </pre>
    </div>
  );
}

function ResultBlock({ block }: { block: ExampleBlock }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "5px 12px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--running)",
          }}
        >
          Resultado esperado
        </span>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "12px 16px",
          background: "var(--bg-surface)",
          fontFamily: "var(--font-mono)",
          fontSize: 12.5,
          lineHeight: 1.65,
          color: "var(--text-primary)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowX: "auto",
        }}
      >
        {block.content}
      </pre>
    </div>
  );
}

function NoteBlock({ block }: { block: ExampleBlock }) {
  return (
    <div
      style={{
        borderLeft: "3px solid var(--accent)",
        borderRadius: "0 6px 6px 0",
        padding: "10px 14px",
        background: "var(--accent-dim)",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <Info className="size-4 shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
      <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-primary)" }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
      </div>
    </div>
  );
}

function Block({ block }: { block: ExampleBlock }) {
  switch (block.type) {
    case "text":   return <TextBlock block={block} />;
    case "code":   return <CodeBlock block={block} />;
    case "result": return <ResultBlock block={block} />;
    case "note":   return <NoteBlock block={block} />;
    default:       return null;
  }
}

export default function ExampleDetail() {
  const { trackId = "aws", exampleId } = useParams<{ trackId: string; exampleId: string }>();
  const navigate = useNavigate();
  const [example, setExample] = useState<Example | null>(null);

  useEffect(() => {
    if (!trackId || !exampleId) return;
    loadExample(trackId, exampleId).then((ex) => setExample(ex));
  }, [trackId, exampleId]);

  if (!example) {
    return (
      <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Cargando ejemplo...
      </div>
    );
  }

  return (
    <div className="mx-auto pb-16 fade-in" style={{ maxWidth: 760 }}>
      <button
        onClick={() => navigate(`/${trackId}/examples`)}
        className="btn btn-ghost btn-sm flex items-center gap-1.5 mb-6"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft className="size-3.5" />
        Volver a ejemplos
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider"
            style={{ background: "var(--bg-overlay)", color: "var(--text-tertiary)", border: "1px solid var(--border)" }}
          >
            {example.category}
          </span>
          <DifficultyDots level={example.difficulty} />
          <span
            className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent)" }}
          >
            Actualizado {example.updatedAt}
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          {example.title}
        </h1>

        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "12px 16px",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>
            Contexto
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {example.context}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {example.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>

      <div className="flex justify-start pt-8 mt-8" style={{ borderTop: "1px solid var(--border)" }}>
        <button
          onClick={() => navigate(`/${trackId}/examples`)}
          className="btn btn-ghost btn-sm flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          Volver a ejemplos
        </button>
      </div>
    </div>
  );
}
