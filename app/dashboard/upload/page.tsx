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
  const [status, setStatus] = useState("");
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
        setPreview(results.data.slice(0, 5));
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

        const rows = results.data;

        // Step 1: Ask AI to categorize all transactions
        setStatus("Categorizing with AI...");

        const categorizeRes = await fetch("/api/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactions: rows.map((r) => ({
              description: r.description,
              amount: parseFloat(r.amount),
            })),
          }),
        });

        const categorizeData = await categorizeRes.json();

        if (categorizeData.error) {
          setError(categorizeData.error);
          setLoading(false);
          return;
        }

        const categoryNames: string[] = categorizeData.categories;
        console.log("AI returned categories:", categoryNames);

        // Step 2: Get category IDs from Supabase (name -> id map)
        // const { data: categoriesData } = await supabase
        //   .from("categories")
        //   .select("id, name");

        const { data: categoriesData, error: categoriesError } = await supabase
  .from("categories")
  .select("id, name");

console.log("Categories fetched:", categoriesData);
console.log("Categories error:", categoriesError);

        const nameToId = new Map(
          (categoriesData || []).map((c) => [c.name, c.id])
        );

        // Step 3: Build final rows with category_id attached
        setStatus("Saving transactions...");

        const finalRows = rows.map((row, i) => ({
          user_id: user.id,
          description: row.description,
          amount: parseFloat(row.amount),
          transaction_date: row.date,
          category_id: nameToId.get(categoryNames[i]) || null,
        }));

        const { error: insertError } = await supabase
          .from("transactions")
          .insert(finalRows);

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
        {loading && status && (
          <p className="mb-4 text-sm text-emerald-600">{status}</p>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {loading ? status || "Uploading..." : "Upload & Save"}
        </Button>
      </Card>
    </main>
  );
}