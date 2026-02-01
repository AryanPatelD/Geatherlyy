"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"
import { Command } from "cmdk"

// Self-contained simplified UI components
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export interface FacultyUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  department: string | null;
}

interface FacultySearchProps {
  onSelect: (user: FacultyUser) => void;
  selectedUsers?: FacultyUser[]; // For multi-select
  multi?: boolean;
  placeholder?: string;
  limit?: number;
}

export function FacultySearch({
  onSelect,
  selectedUsers = [],
  multi = false,
  placeholder = "Search faculty...",
  limit = 1
}: FacultySearchProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [data, setData] = React.useState<FacultyUser[]>([])
  const [loading, setLoading] = React.useState(false)
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Click outside to close
    function handleClickOutside(event: MouseEvent) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
             setOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (query.length < 2) {
      setData([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/users/search-faculty?query=${query}`, {
             headers: {
                Authorization: `Bearer ${token}`
             }
        });
        if (res.ok) {
            const users = await res.json();
            if (Array.isArray(users)) {
                setData(users);
            }
        }
      } catch (error) {
        console.error("Failed to search faculty", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (user: FacultyUser) => {
    onSelect(user);
    if (!multi) {
        setOpen(false)
    }
    setQuery("")
  }

  return (
    <div className="flex flex-col gap-2 relative" ref={wrapperRef}>
      <div 
        onClick={() => !((multi && limit > 0 && selectedUsers.length >= limit)) && setOpen(!open)}
        className={cn(
            "flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            multi && limit > 0 && selectedUsers.length >= limit ? "opacity-50 cursor-not-allowed" : ""
        )}
      >
        <span className="truncate">
             {multi 
              ? selectedUsers.length > 0 
                ? `${selectedUsers.length} selected` 
                : placeholder
              : selectedUsers[0]?.name || placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </div>

      {open && (
         <div className="absolute top-full mt-2 z-50 w-full rounded-md border bg-white dark:bg-gray-800 shadow-md">
            <Command className="w-full overflow-hidden rounded-md">
                <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                    <input 
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Type to search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>
                <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                    {loading && <div className="py-6 text-center text-sm"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>}
                    {!loading && query.length > 0 && data.length === 0 && (
                        <div className="py-6 text-center text-sm">No faculty found.</div>
                    )}
                    {!loading && query.length < 2 && (
                        <div className="py-6 text-center text-sm">Type 2+ characters to search...</div>
                    )}
                    
                    {data.map((user) => {
                        const isSelected = selectedUsers.some(u => u.id === user.id);
                        return (
                            <Command.Item
                                key={user.id}
                                value={user.name}
                                onSelect={() => handleSelect(user)}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 data-[selected=true]:bg-gray-100 dark:data-[selected=true]:bg-gray-700",
                                )}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        isSelected ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <div className="flex flex-col">
                                    <span className="font-medium">{user.name}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                            </Command.Item>
                        )
                    })}
                </Command.List>
            </Command>
         </div>
      )}
      
      {multi && selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
              {selectedUsers.map(user => (
                  <div key={user.id} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 bg-gray-200 dark:bg-gray-700">
                      {user.name}
                      {/* You can allow removing via a button here if needed */}
                  </div>
              ))}
          </div>
      )}
    </div>
  )
}

