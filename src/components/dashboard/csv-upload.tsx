"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertCircle, Download, X } from "lucide-react";

interface ImportResults {
  total: number;
  created: number;
  skipped: number;
  errors: string[];
}

interface CSVUploadProps {
  onImportComplete?: () => void;
}

export function CSVUpload({ onImportComplete }: CSVUploadProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [error, setError] = useState("");

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith(".csv") || droppedFile.type === "text/csv")) {
      setFile(droppedFile);
      setResults(null);
      setError("");
    } else {
      setError("Please upload a .csv file");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
      setError("");
    }
  }, []);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/invoices/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
        setLoading(false);
        return;
      }

      setResults(data);
      if (data.created > 0) {
        onImportComplete?.();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = `client_name,client_email,invoice_number,amount,due_date,description,status
Acme Corp,billing@acme.com,INV-100,5000,2025-03-01,Web Development Services,unpaid
TechStart LLC,pay@techstart.io,INV-101,3200,2025-02-15,API Integration,overdue
GlobalTrade Inc,finance@globaltrade.com,INV-102,8500,2025-04-01,Consulting Q1,unpaid`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoice_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetState = () => {
    setFile(null);
    setResults(null);
    setError("");
    setLoading(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Invoices from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadTemplate}
            className="gap-2 text-primary"
          >
            <Download className="h-4 w-4" />
            Download CSV Template
          </Button>

          {/* Drop zone */}
          {!results && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
              `}
              onClick={() => document.getElementById("csv-file-input")?.click()}
            >
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drop your CSV file here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Required columns: amount, due_date
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Optional: client_name, client_email, invoice_number, description, status
                  </p>
                </>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Results */}
          {results && (
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Import Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-emerald-500">{results.created}</p>
                    <p className="text-xs text-muted-foreground">Created</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-500">{results.skipped}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{results.total}</p>
                    <p className="text-xs text-muted-foreground">Total Rows</p>
                  </div>
                </div>
                {results.errors.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-500/10 text-sm space-y-1">
                    <p className="font-medium text-amber-500">Warnings:</p>
                    {results.errors.slice(0, 5).map((err, i) => (
                      <p key={i} className="text-muted-foreground text-xs">{err}</p>
                    ))}
                    {results.errors.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        ... and {results.errors.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {results ? (
              <Button onClick={() => setOpen(false)}>Done</Button>
            ) : (
              <Button onClick={handleImport} disabled={!file || loading}>
                {loading ? "Importing..." : "Import Invoices"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
