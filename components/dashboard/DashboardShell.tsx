"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ClipboardCheck,
  CircleHelp,
  Grid2X2,
  Moon,
  Plus,
  Search,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { roles, searchItems } from "@/app/dashboard/data";

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const navItems = [
  { href: "/dashboard", icon: <Grid2X2 size={16} />, label: "Dashboard" },
  {
    href: "/dashboard/assessments",
    icon: <ClipboardCheck size={16} />,
    label: "Assessments",
  },
  { href: "/dashboard/roles", icon: <BriefcaseBusiness size={16} />, label: "Roles" },
  { href: "/dashboard/candidates", icon: <UserRound size={16} />, label: "Candidates" },
  { href: "/dashboard/insights", icon: <BarChart3 size={16} />, label: "Insights" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState<string | undefined>();

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return [];
    }

    return searchItems
      .filter((item) =>
        `${item.label} ${item.meta} ${item.type}`.toLowerCase().includes(normalized),
      )
      .slice(0, 5);
  }, [query]);

  function submitAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModalOpen(false);
    setToast("Assessment draft created");
    window.setTimeout(() => setToast(undefined), 2400);
  }

  return (
    <main
      className={classNames(
        "min-h-screen bg-white",
        darkMode && "bg-white",
      )}
    >
      <section
        className={classNames(
          "grid min-h-screen w-full grid-cols-1 bg-white lg:grid-cols-[200px_1fr]",
          darkMode && "bg-white",
        )}
      >
        <aside className="flex flex-col border-b border-[#ece9e5] bg-white px-3 py-4 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div>
            <Link className="text-lg font-mono text-[#202322] font-semibold" href="/dashboard">
              chayote
            </Link>
          </div>

          <button
            className="mt-4 flex h-8 w-full items-center justify-center gap-1.5 rounded-[3px] bg-primary text-[13px] font-semibold text-[#111510] transition duration-150 hover:bg-[#d7ff5a] focus:outline-none focus:ring-2 focus:ring-[#202322] focus:ring-offset-2"
            onClick={() => setModalOpen(true)}
            type="button"
          >
            <Plus size={16} />
            New Assessment
          </button>

          <nav className="mt-4 grid gap-1 sm:grid-cols-2 lg:block lg:space-y-1">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  className={classNames(
                    "flex h-7 items-center gap-2 rounded-[3px] px-2 text-left text-[13px] font-medium transition duration-150",
                    active
                      ? "bg-[#ebe9e6] text-[#202322]"
                      : "text-[#4f544b] hover:bg-[#efedea] hover:text-[#202322]",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 grid gap-1 sm:grid-cols-2 lg:mt-auto lg:block lg:space-y-1">
            <button
              className="flex h-7 items-center gap-2 px-2 text-left text-[13px] font-medium text-[#51554c] transition duration-150 hover:text-[#202322]"
              onClick={() => setToast("Support workspace opened")}
              type="button"
            >
              <CircleHelp size={16} />
              <span>Support</span>
            </button>
            <button
              className="flex h-7 items-center gap-2 px-2 text-left text-[13px] font-medium text-[#51554c] transition duration-150 hover:text-[#202322]"
              onClick={() => setDarkMode((value) => !value)}
              type="button"
            >
              <Moon size={16} />
              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>
        </aside>

        <div className="min-w-0 bg-white px-4 py-5 sm:px-6 lg:px-10 lg:py-6">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-[320px]">
              <label className="relative block">
                <span className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 text-[#777970]" />
                </span>
                <input
                  className="h-9 w-full rounded-full border border-[#e2dfdb] bg-white/72 pl-9 pr-4 text-[13px] text-[#3b4038] outline-none transition duration-150 placeholder:text-[#a29f99] focus:border-[#c9c5bf] focus:ring-2 focus:ring-[#d7ff5a]"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search candidates, roles, skills..."
                  type="search"
                  value={query}
                />
              </label>

              {matches.length > 0 ? (
                <div className="absolute left-0 right-0 top-10 z-30 overflow-hidden rounded-[8px] border border-[#e7e4de] bg-white shadow-[0_18px_50px_rgba(31,31,27,0.12)]">
                  {matches.map((item) => (
                    <Link
                      className="flex items-center justify-between border-b border-[#f1efea] px-3 py-2.5 text-[13px] last:border-b-0 hover:bg-[#faf9f6]"
                      href={item.href}
                      key={`${item.type}-${item.label}`}
                      onClick={() => setQuery("")}
                    >
                      <span>
                        <span className="block font-medium text-[#202322]">
                          {item.label}
                        </span>
                        <span className="text-xs text-[#70756c]">{item.meta}</span>
                      </span>
                      <span className="text-xs font-semibold text-[#777c72]">
                        {item.type}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative flex items-center gap-2">
              <button
                aria-label="Notifications"
                className="relative grid h-8 w-8 place-items-center text-[#4b5149] transition duration-150 hover:text-[#202322]"
                onClick={() => {
                  setNotificationsOpen((value) => !value);
                  setSettingsOpen(false);
                  setProfileOpen(false);
                }}
                type="button"
              >
                <Bell size={18} />
                <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#a8ad9f]" />
              </button>
              <button
                aria-label="Settings"
                className="grid h-8 w-8 place-items-center text-[#4b5149] transition duration-150 hover:text-[#202322]"
                onClick={() => {
                  setSettingsOpen((value) => !value);
                  setNotificationsOpen(false);
                  setProfileOpen(false);
                }}
                type="button"
              >
                <Settings size={18} />
              </button>
              <button
                aria-label="Profile"
                className="grid h-8 w-8 place-items-center text-[#4b5149] transition duration-150 hover:text-[#202322]"
                onClick={() => {
                  setProfileOpen((value) => !value);
                  setNotificationsOpen(false);
                  setSettingsOpen(false);
                }}
                type="button"
              >
                <UserRound size={18} />
              </button>

              {notificationsOpen ? (
                <div className="absolute right-8 top-10 z-30 w-[260px] rounded-[8px] border border-[#e7e4de] bg-white p-3 shadow-[0_18px_50px_rgba(31,31,27,0.12)]">
                  <p className="text-xs font-semibold">
                    Notifications
                  </p>
                  <div className="mt-2 space-y-2 text-[13px] text-[#4d5249]">
                    <p>Elena Chen is overdue on Rust Core Systems.</p>
                    <p>3 candidate reviews are ready.</p>
                    <p>ML Systems Design draft needs criteria.</p>
                  </div>
                </div>
              ) : null}

              {settingsOpen ? (
                <div className="absolute right-8 top-10 z-30 w-[230px] rounded-[8px] border border-[#e7e4de] bg-white p-3 shadow-[0_18px_50px_rgba(31,31,27,0.12)]">
                  <p className="text-xs font-semibold">
                    Workspace
                  </p>
                  <label className="mt-3 flex items-center justify-between text-[13px]">
                    Compact rows
                    <input className="accent-[#202322]" type="checkbox" />
                  </label>
                  <label className="mt-2 flex items-center justify-between text-[13px]">
                    Email alerts
                    <input className="accent-[#202322]" defaultChecked type="checkbox" />
                  </label>
                </div>
              ) : null}

              {profileOpen ? (
                <div className="absolute right-0 top-10 z-30 w-[200px] rounded-[8px] border border-[#e7e4de] bg-white p-3 shadow-[0_18px_50px_rgba(31,31,27,0.12)]">
                  <p className="font-semibold">Profile</p>
                  <p className="mt-1 text-xs text-[#6b7067]">Testing mode</p>
                  <Link
                    className="mt-3 block text-[13px] font-medium underline underline-offset-4"
                    href="/auth"
                  >
                    Go to sign in
                  </Link>
                </div>
              ) : null}
            </div>
          </header>

          <div className="mt-6">{children}</div>
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
          <form
            className="w-full max-w-[420px] rounded-[8px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
            onSubmit={submitAssessment}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">New assessment</h2>
                <p className="mt-1.5 text-[13px] text-[#686d63]">
                  Create a draft to refine later.
                </p>
              </div>
              <button
                aria-label="Close"
                className="text-[#4b5149] transition duration-150 hover:text-[#202322]"
                onClick={() => setModalOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <label className="grid gap-1.5 text-sm font-medium">
                Assessment name
                <input
                  className="h-9 border border-[#dedbd5] bg-white px-3 text-[13px] outline-none focus:border-[#202322] focus:ring-2 focus:ring-[#d7ff5a]"
                  defaultValue="Untitled technical screen"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Role
                <select className="h-9 border border-[#dedbd5] bg-white px-3 text-[13px] outline-none focus:border-[#202322] focus:ring-2 focus:ring-[#d7ff5a]">
                  {roles.map((role) => (
                    <option key={role.id}>{role.title}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Template
                <select className="h-9 border border-[#dedbd5] bg-white px-3 text-[13px] outline-none focus:border-[#202322] focus:ring-2 focus:ring-[#d7ff5a]">
                  <option>Systems design</option>
                  <option>Debugging exercise</option>
                  <option>Product critique</option>
                  <option>Portfolio review</option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="h-8 border border-[#d8d5cf] px-3 text-[13px] font-medium"
                onClick={() => setModalOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-8 bg-primary px-3 text-[13px] font-bold text-[#111510] transition duration-150 hover:bg-[#d7ff5a]"
                type="submit"
              >
                Create draft
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-[8px] bg-[#202322] px-4 py-3 text-sm font-medium text-white shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
