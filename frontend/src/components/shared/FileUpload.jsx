import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

function FileUpload({ onUpload, accept = 'image/*', multiple = true, maxFiles = 10 }) {
  const [previews, setPreviews] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const fileArray = Array.from(files).slice(0, maxFiles);
    const newPreviews = fileArray.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, maxFiles));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const removePreview = (index) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    if (previews.length === 0) return;
    const formData = new FormData();
    previews.forEach((p) => formData.append('images', p.file));
    await onUpload(formData);
    setPreviews([]);
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-sm transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <p className="font-medium">Drop files here or click to browse</p>
        <p className="mt-1 text-muted-foreground">Max {maxFiles} files</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {previews.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {previews.map((p, i) => (
              <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-md border">
                <img
                  src={p.url}
                  alt={`Preview ${i}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => removePreview(i)}
                  className="absolute top-0 right-0 hidden h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white group-hover:flex"
                >
                  \u2715
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Upload {previews.length} file(s)
          </button>
        </>
      )}
    </div>
  );
}

export default FileUpload;
