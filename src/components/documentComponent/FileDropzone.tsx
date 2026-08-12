// src/components/documentComponent/FileDropzone.tsx
import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { File as FileGlyph, Upload } from "lucide-react";
import { toast } from "react-toastify";
import {
  MAX_UPLOAD_FILE_SIZE_BYTES,
  fileTypeFromFileName,
  formatFileSize,
} from "./documentDisplay";

interface FileDropzoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
}

// Dropzone for the Upload/Edit panel's "Upload file" mode. Accepts
// PDF/DOCX/Markdown up to 25MB (spec's stated limits) via drag-and-drop or
// click-to-browse. No backend is involved — the File API gives real
// name/size/type data client-side, so this is a genuine interaction, not a
// stub.
export function FileDropzone({
  selectedFile,
  onFileSelect,
}: FileDropzoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    if (!fileTypeFromFileName(file.name)) {
      toast.error("Only PDF, DOCX, or Markdown files are supported.");
      return;
    }
    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      toast.error("File is larger than 25MB.");
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files[0];
    if (file) validateAndSelect(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) validateAndSelect(file);
    event.target.value = "";
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center text-sm transition-colors ${
          isDraggingOver
            ? "border-accent bg-accent-soft"
            : "border-border hover:bg-surface-sunken"
        }`}
      >
        {selectedFile ? (
          <>
            <FileGlyph size={20} className="text-ink-muted" />
            <p className="text-ink font-medium">{selectedFile.name}</p>
            <p className="text-ink-muted text-xs">
              {formatFileSize(selectedFile.size)} · click to choose a different
              file
            </p>
          </>
        ) : (
          <>
            <Upload size={20} className="text-ink-muted" />
            <p className="text-ink font-medium">
              Drag and drop a file, or click to browse
            </p>
            <p className="text-ink-muted text-xs">
              PDF, DOCX, or Markdown, up to 25MB
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.md,.markdown"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
