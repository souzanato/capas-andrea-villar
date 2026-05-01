"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CoverCard from "./CoverCard";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";

interface CoverItem {
  id: string;
  title: string;
  format: string;
  status: string;
  createdAt: string;
  contentType: string;
  baseImageId: string | null;
  generatedImages: Array<{
    id: string;
    version: number;
    width: number;
    height: number;
  }>;
}

interface DashboardClientProps {
  initialCovers: CoverItem[];
  total: number;
  page: number;
  totalPages: number;
  currentQ: string;
  currentStatus: string;
  currentSort: string;
  isAdmin?: boolean;
  filteringUser?: { name: string | null; email: string } | null;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "COMPLETED", label: "Concluídas" },
  { value: "PENDING", label: "Aguardando" },
  { value: "GENERATING_IMAGE", label: "Renderizando" },
  { value: "FAILED", label: "Falhadas" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mais recentes" },
  { value: "oldest", label: "Mais antigas" },
  { value: "title", label: "Título A-Z" },
];

export default function DashboardClient({
  initialCovers,
  total,
  page,
  totalPages,
  currentQ,
  currentStatus,
  currentSort,
  isAdmin,
  filteringUser,
}: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [covers, setCovers] = useState(initialCovers);
  const [totalCount, setTotalCount] = useState(total);
  const [searchInput, setSearchInput] = useState(currentQ);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (searchParams.get("confirmed") === "true") {
      toast.success("Conta confirmada com sucesso! Bem-vinda(o)!");
    }
  }, []);

  // Sync when props change (after URL update + server re-render)
  useEffect(() => {
    setCovers(initialCovers);
    setTotalCount(total);
  }, [initialCovers, total]);

  // Keep search input in sync when URL changes externally
  useEffect(() => {
    setSearchInput(currentQ);
  }, [currentQ]);

  function buildUrl(overrides: Record<string, string | number>): string {
    const params = new URLSearchParams();

    const q = String(overrides.q ?? currentQ);
    const status = String(overrides.status ?? currentStatus);
    const sort = String(overrides.sort ?? currentSort);
    const p = Number(overrides.page ?? page);

    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));

    const qs = params.toString();
    return `/dashboard${qs ? `?${qs}` : ""}`;
  }

  function navigate(url: string) {
    router.push(url);
  }

  function handleSearchInput(value: string) {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      navigate(buildUrl({ q: value, page: 1 }));
    }, 300);
  }

  function handleStatusChange(value: string) {
    navigate(buildUrl({ status: value, page: 1 }));
  }

  function handleSortChange(value: string) {
    navigate(buildUrl({ sort: value, page: 1 }));
  }

  function handlePageChange(newPage: number) {
    navigate(buildUrl({ page: newPage }));
  }

  function handleClearFilters() {
    setSearchInput("");
    navigate("/dashboard");
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const hasFilters = currentQ || currentStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-medium text-foreground tracking-tight">
            {isAdmin ? "Todas as capas" : "Suas capas"}
          </h1>
          <p className="text-sm text-foreground-soft mt-1">
            {totalCount === 0
              ? "Comece criando a primeira"
              : `${totalCount} ${totalCount === 1 ? "capa criada" : "capas criadas"}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/new">Nova capa</Link>
        </Button>
      </div>

      {/* Banner de filtro por criador (admin) */}
      {filteringUser && (
        <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm">
          <span>
            Mostrando capas de{" "}
            <strong>{filteringUser.name ?? filteringUser.email}</strong>
          </span>
          <Link href="/dashboard" className="text-primary underline text-xs">
            Ver todas
          </Link>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Buscar por título..."
            className="w-full h-10 rounded-md border border-input bg-white pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Status filter */}
        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-10 rounded-md border border-input bg-white px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="h-10 rounded-md border border-input bg-white px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid or empty state */}
      {covers.length === 0 ? (
        <EmptyState
          variant={hasFilters ? "no-results" : "no-covers"}
          onClearFilters={hasFilters ? handleClearFilters : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {covers.map((cover) => (
              <CoverCard key={cover.id} cover={cover} />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
