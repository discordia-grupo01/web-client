import { useCallback, useRef, useState } from "react";

export function useChatDragDrop(onDrop: (files: FileList) => void) {
  const [isDragging, setIsDragging] = useState(false);

  const dragCounter = useRef(0);

  const hasFiles = (event: React.DragEvent) =>
    Array.from(event.dataTransfer.types).includes("Files");

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!hasFiles(event)) return;
    dragCounter.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!hasFiles(event)) return;
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      const files = event.dataTransfer.files;
      if (files.length > 0) onDrop(files);
    },
    [onDrop],
  );

  return {
    isDragging,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
