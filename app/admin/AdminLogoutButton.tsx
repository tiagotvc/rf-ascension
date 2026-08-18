"use client";
import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();
  async function onClick() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  return <b role="button" tabIndex={0} onClick={onClick} style={{ cursor: "pointer" }}>Sair</b>;
}
