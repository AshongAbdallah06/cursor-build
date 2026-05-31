import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface AssistantMessageContentProps {
  content: string;
  className?: string;
}

export function AssistantMessageContent({
  content,
  className,
}: AssistantMessageContentProps) {
  return (
    <div
      className={cn(
        "break-words [overflow-wrap:anywhere] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2"
            >
              {children}
            </a>
          ),
          h1: ({ children }) => (
            <h1 className="mb-2 text-base font-semibold last:mb-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 text-sm font-semibold last:mb-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1.5 text-sm font-semibold last:mb-0">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-2 border-l-2 border-border pl-3 text-muted-foreground last:mb-0">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-2 border-border" />,
          code: ({ className: codeClassName, children, ...props }) => {
            if (codeClassName) {
              return (
                <code className={cn("font-mono text-xs", codeClassName)} {...props}>
                  {children}
                </code>
              );
            }

            return (
              <code
                className="rounded bg-background/70 px-1 py-0.5 font-mono text-xs"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-2 overflow-x-auto rounded-lg bg-background/70 p-2 font-mono text-xs last:mb-0">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="mb-2 overflow-x-auto last:mb-0">
              <table className="w-full min-w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-border">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-border/60 last:border-b-0">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-2 py-1 font-semibold">{children}</th>
          ),
          td: ({ children }) => <td className="px-2 py-1 align-top">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
