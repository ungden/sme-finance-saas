"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle, X, Loader2 } from "lucide-react";

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export default function FileUploader({ onFileUpload, isLoading }: FileUploaderProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.match(/image.*/) || file.type === "application/pdf") {
      onFileUpload(file);
    } else {
      alert("Vui lòng tải lên file ảnh hoặc PDF hợp lệ.");
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 ease-in-out flex flex-col items-center justify-center text-center
          ${dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-white"
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleChange}
          accept="image/*,.pdf"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex items-center space-x-3 py-2 pointer-events-none z-20">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-slate-800">AI đang phân tích hóa đơn...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 py-2 pointer-events-none z-20">
            <UploadCloud className="w-6 h-6 text-slate-400" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-800">Gợi ý tự động điền</h3>
              <p className="text-xs text-slate-500">Kéo thả hóa đơn photo hoặc PDF vào đây để AI đọc</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
