"use client";

import { useRef, useState } from "react";
import { Camera, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CameraUploadShortcut() {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");

  function openCamera() {
    inputRef.current?.click();
  }

  function onChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  }

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Carica documento con fotocamera</div>
          <div className="mt-1 text-sm text-slate-500">Scorciatoia mobile per allegare documenti dal telefono.</div>
        </div>
        <div className="rounded-2xl bg-blue-50 p-2 text-blue-700">
          <FileImage className="h-4 w-4" />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onChange}
      />

      <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
        {fileName ? `File pronto: ${fileName}` : "Apri la fotocamera per acquisire un documento o un giustificativo."}
      </div>

      <Button className="mt-4 w-full rounded-2xl" variant="outline" onClick={openCamera}>
        <Camera className="mr-2 h-4 w-4" />
        Apri fotocamera
      </Button>
    </div>
  );
}

export default CameraUploadShortcut;
