import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onUpdate: (html: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
}

export function RichTextEditor({
  value,
  onUpdate,
  placeholder = "Clique para adicionar",
  className,
  autoFocus = false,
  onBlur,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
    ],
    content: value || "",
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[120px] focus:outline-none uppercase text-xs px-2 py-1.5 cursor-text [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:pl-1 [&_li>p]:my-0 [&_p]:my-1",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate(html === "<p></p>" ? "" : html);
    },
    onBlur: () => onBlur?.(),
  });

  // Sync external value changes
  useEffect(() => {
    if (!editor) return;
    // Don't overwrite content while the user is actively typing —
    // the parent re-sends the saved value and was resetting the cursor.
    if (editor.isFocused) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next !== current && next !== (current === "<p></p>" ? "" : current)) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    cn(
      "h-6 w-6 inline-flex items-center justify-center rounded text-[11px] transition-colors",
      active
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  return (
    <div
      className={cn(
        "bg-background border border-primary/30 rounded overflow-hidden",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-0.5 border-b border-border/50 px-1.5 py-1 bg-muted/40">
        <button
          type="button"
          className={btn(editor.isActive("bold"))}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrito (Ctrl+B)"
        >
          <Bold className="h-3 w-3" />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("italic"))}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Itálico (Ctrl+I)"
        >
          <Italic className="h-3 w-3" />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("underline"))}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Sublinhado (Ctrl+U)"
        >
          <UnderlineIcon className="h-3 w-3" />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("strike"))}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Tachado"
        >
          <Strikethrough className="h-3 w-3" />
        </button>
        <div className="w-px h-4 bg-border/60 mx-1" />
        <button
          type="button"
          className={btn(editor.isActive("bulletList"))}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista com tópicos"
        >
          <List className="h-3 w-3" />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("orderedList"))}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
        >
          <ListOrdered className="h-3 w-3" />
        </button>
      </div>
      <div
        className="resize-y overflow-auto min-h-[120px] max-h-[800px] cursor-text"
        style={{ resize: "vertical" }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            editor.chain().focus("end").run();
          }
        }}
      >
        <EditorContent
          editor={editor}
          className="min-h-[120px] h-full [&_.ProseMirror]:min-h-[120px] [&_.ProseMirror]:h-full"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              editor.chain().focus("end").run();
            }
          }}
        />
      </div>
    </div>
  );
}