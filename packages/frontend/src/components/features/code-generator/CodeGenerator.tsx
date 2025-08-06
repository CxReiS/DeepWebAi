import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { useEffect, useRef } from "react";

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  theme = "dark",
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>();

  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = [
      basicSetup,
      language === "javascript" ? javascript() : python(),
      theme === "dark" ? oneDark : [],
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange?.(update.state.doc.toString());
        }
      }),
    ];

    viewRef.current = new EditorView({
      extensions,
      parent: editorRef.current,
      doc: value,
    });

    return () => viewRef.current?.destroy();
  }, []);

  return <div ref={editorRef} className="code-editor" />;
}
