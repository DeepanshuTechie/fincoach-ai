"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CsvRow = {
  description: string;
  amount: string;
  date: string;
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const supabase = createClient();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError("");

    Papa.parse<CsvRow>(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data.slice(0, 5)); // show first 5 rows as preview
      },
    });
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError("");

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in.");
          setLoading(false);
          return;
        }

        const rows = results.data.map((row) => ({
          user_id: user.id,
          description: row.description,
          amount: parseFloat(row.amount),
          transaction_date: row.date,
        }));

        const { error: insertError } = await supabase
          .from("transactions")
          .insert(rows);

        setLoading(false);

        if (insertError) {
          setError(insertError.message);
          return;
        }

        router.push("/dashboard");
        router.refresh();
      },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg p-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Upload Bank Statement
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          CSV should have columns: <code>description</code>,{" "}
          <code>amount</code>, <code>date</code> (YYYY-MM-DD)
        </p>

        <div className="mb-4">
          <Label htmlFor="csv">Choose CSV file</Label>
          <Input
            id="csv"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />
        </div>

        {preview.length > 0 && (
          <div className="mb-4 rounded-md border border-slate-200 p-3 text-xs">
            <p className="mb-2 font-medium text-slate-700">
              Preview (first {preview.length} rows):
            </p>
            {preview.map((row, i) => (
              <div key={i} className="text-slate-500">
                {row.description} — ₹{row.amount} — {row.date}
              </div>
            ))}
          </div>
        )}

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <Button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {loading ? "Uploading..." : "Upload & Save"}
        </Button>
      </Card>
    </main>
  );
}