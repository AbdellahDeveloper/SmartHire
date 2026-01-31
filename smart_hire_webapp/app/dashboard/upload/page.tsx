"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import JSZip from "jszip";
import { CheckCircle2, FileArchive, FileText, Loader2, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { uploadCandidates } from "../actions";



export default function CandidatesUploadPage() {
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [updateIfExists, setUpdateIfExists] = useState(false);



    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files);
        setSelectedFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const clearAll = () => setSelectedFiles([]);

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setUploading(true);

        const processedFormData = new FormData();
        processedFormData.append("updateIfExists", updateIfExists.toString());

        let pdfCount = 0;

        try {
            for (const file of selectedFiles) {
                const lowerName = file.name.toLowerCase();

                if (lowerName.endsWith(".zip")) {
                    const zip = new JSZip();
                    const content = await file.arrayBuffer();
                    const loadedZip = await zip.loadAsync(content);

                    for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
                        if (!zipEntry.dir && relativePath.toLowerCase().endsWith(".pdf")) {
                            const pdfContent = await zipEntry.async("arraybuffer");
                            const fileName = relativePath.split('/').pop() || "extracted.pdf";
                            const pdfFile = new File([pdfContent], fileName, {
                                type: "application/pdf"
                            });
                            processedFormData.append("files", pdfFile);
                            pdfCount++;
                        }
                    }
                } else if (lowerName.endsWith(".pdf")) {
                    processedFormData.append("files", file);
                    pdfCount++;
                }
                // Other files (non pdf/zip) are ignored as per "get rid of" request
            }

            if (pdfCount === 0) {
                toast.error("No PDF files found to upload.");
                setUploading(false);
                return;
            }

            const result = await uploadCandidates(processedFormData);
            if (result.success) {
                toast.success(result.message || `${pdfCount} candidate(s) sent for processing!`);
                setSelectedFiles([]);
            } else {
                toast.error(result.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("An unexpected error occurred during processing");
        } finally {
            setUploading(false);
        }
    };



    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-bold text-foreground tracking-tight">Bulk Upload Candidates</h1>
                <p className="text-muted-foreground mt-2">Upload ZIP archives or multiple PDF resumes to process them into your candidate pool.</p>
            </div>

            <Card
                className={cn(
                    "bg-card/50 border-border border-2 border-dashed relative overflow-hidden group transition-all duration-300",
                    isDragging && "border-primary bg-primary/5 scale-[1.01] shadow-2xl shadow-primary/10"
                )}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <CardContent className="p-12">
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center ring-2 transition-all duration-500 ${isDragging ? "bg-primary text-primary-foreground scale-110 ring-primary shadow-lg shadow-primary/20" : "bg-primary/10 text-primary ring-primary/20 group-hover:scale-110"}`}>
                            <Upload className={`w-10 h-10 ${isDragging ? "animate-bounce" : ""}`} />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-foreground">
                                {isDragging ? "Drop to add files" : "Drag & drop files here"}
                            </h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                Supported formats: .zip, .pdf.
                                <br />
                                Max upload size: <b>1GB</b>.
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="file-upload"
                                className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-medium transition-colors"
                            >
                                Select Files
                            </Label>
                            <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                multiple
                                accept=".pdf,.zip"
                                onChange={(e) => handleFileSelect(e.target.files)}
                            />
                        </div>
                    </div>
                </CardContent>

                <div className="px-12 pb-8 flex items-center justify-center gap-8">

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="update-mode"
                            checked={updateIfExists}
                            onCheckedChange={setUpdateIfExists}
                        />
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="update-mode" className="cursor-pointer">
                                Update If Exists
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Update the candidate cv if already exists, else it will be ignored
                            </p>
                        </div>
                    </div>
                </div>


                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FileText className="w-32 h-32" />
                </div>
            </Card>

            {selectedFiles.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-foreground">
                            Selected Files ({selectedFiles.length})
                        </h2>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                onClick={clearAll}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                Clear All
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[140px]"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    "Upload All"
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {selectedFiles.map((file, index) => (
                            <Card key={`${file.name}-${index}`} className="bg-card/50 border-border group hover:border-primary/50 transition-all duration-300">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                        {file.name.endsWith('.zip') ? (
                                            <FileArchive className="w-6 h-6 text-primary" />
                                        ) : (
                                            <FileText className="w-6 h-6 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="text-sm font-medium text-foreground truncate" title={file.name}>
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid gap-6 w-full">
                <Card className="bg-card/50 border-border w-full">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                            Best Practices
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2 pl-12">
                        <li>Ensure PDF files are not password protected.</li>
                        <li>ZIP files should contain resumes at the root level.</li>
                        <li>High-quality text-based PDFs work best for matching.</li>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
