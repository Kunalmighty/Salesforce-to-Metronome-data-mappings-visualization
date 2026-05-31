import React, { useState, useMemo, useEffect } from "react";
import { fetchMappings, Mapping, parseMappingsCsv } from "./utils/data";
import { MappingCard } from "./components/MappingCard";
import { LayoutDashboard, Filter, Search, List, Activity, Menu, X, Moon, Sun, Upload, RotateCcw, ArrowLeft, FileText } from "lucide-react";

const csvFormatRows = [
  ["Sync operation", "Functional area for the mapping, such as Contract Creation or Subscription Creation."],
  ["Direction", "Use values that begin with Salesforce or Metronome so the app can orient the mapping card."],
  ["Metronome Field", "Target or source field name in Metronome."],
  ["Metronome Field Type", "Data type for the Metronome field, such as Text, DateTime, Boolean, or Integer."],
  ["Metronome Object", "Metronome object that owns the mapped field."],
  ["Metronome Parent Object (1)", "Optional parent object for nested Metronome structures."],
  ["Notes", "Optional implementation notes or open questions."],
  ["Salesforce Field", "Target or source field name in Salesforce."],
  ["Salesforce Object", "Salesforce object that owns the mapped field."],
  ["Transformation / Logic", "Optional transformation, derivation, or lookup instructions."],
];

export default function App() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dataSourceName, setDataSourceName] = useState("Bundled CSV");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadGuide, setShowUploadGuide] = useState(false);

  useEffect(() => {
    // Check system preference on load
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetchMappings()
      .then((data) => {
        setMappings(data);
        setDataSourceName("Bundled CSV");
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load mapping data.");
        setLoading(false);
      });
  }, []);

  const resetFilters = () => {
    setSelectedOperation(null);
    setSelectedDirection(null);
    setSearchQuery("");
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const csvText = await file.text();
      const data = await parseMappingsCsv(csvText);
      setMappings(data);
      setDataSourceName(file.name);
      setUploadError(null);
      setShowUploadGuide(false);
      resetFilters();
    } catch (err) {
      console.error(err);
      setUploadError("Could not parse that CSV.");
    }
  };

  const openUploadGuide = () => {
    setUploadError(null);
    setMobileMenuOpen(false);
    setShowUploadGuide(true);
  };

  const handleResetCsv = async () => {
    try {
      const data = await fetchMappings();
      setMappings(data);
      setDataSourceName("Bundled CSV");
      setUploadError(null);
      resetFilters();
    } catch (err) {
      console.error(err);
      setUploadError("Could not reload the bundled CSV.");
    }
  };

  const uniqueOperations = useMemo(() => {
    const ops = new Set<string>();
    mappings.forEach((m) => {
      const op = m["Sync operation"]?.trim();
      if (op) ops.add(op);
    });
    return Array.from(ops).sort();
  }, [mappings]);

  const uniqueDirections = useMemo(() => {
    const dirs = new Set<string>();
    mappings.forEach((m) => {
      const d = m.Direction?.trim();
      if (d) dirs.add(d);
    });
    return Array.from(dirs).sort();
  }, [mappings]);

  const filteredMappings = useMemo(() => {
    return mappings.filter((m) => {
      const opMatch = !selectedOperation || m["Sync operation"]?.trim() === selectedOperation;
      const dirMatch = !selectedDirection || m.Direction?.trim() === selectedDirection;
      const searchMatch =
        !searchQuery ||
        Object.values(m).some(
          (val) =>
            typeof val === "string" && val.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return opMatch && dirMatch && searchMatch;
    });
  }, [mappings, selectedOperation, selectedDirection, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-8 h-8 text-blue-600 dark:text-blue-500 animate-pulse" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading mappings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-8 max-w-md text-center">
          <p className="font-semibold text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg text-sm hover:bg-red-700 dark:hover:bg-red-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (showUploadGuide) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <button
              onClick={() => setShowUploadGuide(false)}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to mappings
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
              <FileText className="w-4 h-4" />
              CSV upload
            </div>
            <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
              Prepare your mappings CSV
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              Upload a comma-separated CSV with one mapping per row. Keep the header names exactly as shown so filters, mapping cards, and search can read each column correctly.
            </p>
          </div>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">Required columns</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Column order can vary, but these header labels must be present.
                </p>
              </div>
              <label
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition cursor-pointer shadow-sm"
                title="Upload CSV"
              >
                <Upload className="w-4 h-4" />
                Choose CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvUpload}
                  className="sr-only"
                />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="text-left font-semibold px-5 py-3">Header</th>
                    <th className="text-left font-semibold px-5 py-3">Expected content</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {csvFormatRows.map(([header, description]) => (
                    <tr key={header}>
                      <td className="px-5 py-3 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {header}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                        {description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {uploadError && (
            <div className="mt-6 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {uploadError}
            </div>
          )}

          <div className="mt-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
            Blank cells are allowed. Empty Salesforce fields can still be inferred for known custom metadata and product-derived mappings.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col md:flex-row text-slate-900 dark:text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 md:h-screen overflow-y-auto z-10 hidden md:block">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 font-semibold text-lg text-slate-800 dark:text-slate-100">
              <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              Field Mappings
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Salesforce ↔ Metronome integration definitions.
            </p>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Operations
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedOperation(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedOperation === null
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                All Operations
              </button>
              {uniqueOperations.map((op) => (
                <button
                  key={op}
                  onClick={() => setSelectedOperation(op)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${
                    selectedOperation === op
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <span className="truncate">{op}</span>
                  <span className="text-xs opacity-60">
                    {mappings.filter((m) => m["Sync operation"]?.trim() === op).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
              <List className="w-3.5 h-3.5" /> Direction
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedDirection(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDirection === null
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                All Directions
              </button>
              {uniqueDirections.map((dir) => (
                <button
                  key={dir}
                  onClick={() => setSelectedDirection(dir)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedDirection === dir
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            Field Mappings
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -mr-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Content */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[65px] bg-white dark:bg-slate-900 z-20 overflow-y-auto border-t border-slate-100 dark:border-slate-800">
            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" /> Operations
                </h3>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setSelectedOperation(null);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedOperation === null
                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    All Operations
                  </button>
                  {uniqueOperations.map((op) => (
                    <button
                      key={op}
                      onClick={() => {
                        setSelectedOperation(op);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${
                        selectedOperation === op
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      <span className="truncate">{op}</span>
                      <span className="text-xs opacity-60">
                        {mappings.filter((m) => m["Sync operation"]?.trim() === op).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                  <List className="w-3.5 h-3.5" /> Direction
                </h3>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setSelectedDirection(null);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedDirection === null
                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    All Directions
                  </button>
                  {uniqueDirections.map((dir) => (
                    <button
                      key={dir}
                      onClick={() => {
                        setSelectedDirection(dir);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedDirection === dir
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
          <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {selectedOperation || "All Operations"}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Showing {filteredMappings.length} mappings{" "}
                {selectedDirection ? `for ${selectedDirection}` : ""}
                <span className="block text-xs mt-1">
                  Source: {dataSourceName}
                </span>
              </p>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 md:items-center">
              <div className="flex gap-2">
                <button
                  onClick={openUploadGuide}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition cursor-pointer shadow-sm"
                  title="Upload CSV"
                >
                  <Upload className="w-4 h-4" />
                  Upload CSV
                </button>
                {dataSourceName !== "Bundled CSV" && (
                  <button
                    onClick={handleResetCsv}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
                    title="Use bundled CSV"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                )}
              </div>
              <div className="relative w-full sm:w-72 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search fields, objects, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="mb-6 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {uploadError}
            </div>
          )}

          <div className="space-y-6">
            {filteredMappings.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No mappings found</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Try adjusting your filters or search query to find what you're looking for.
                </p>
                {(selectedOperation || selectedDirection || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedOperation(null);
                      setSelectedDirection(null);
                      setSearchQuery("");
                    }}
                    className="mt-6 text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-4 py-2 rounded-lg transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredMappings.map((mapping, idx) => (
                  <MappingCard key={idx} mapping={mapping} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
