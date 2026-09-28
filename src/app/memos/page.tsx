import React from "react";
import { getMemos, getTags } from "@/app/actions";
import MemoListClient from "@/components/MemoListClient";

export const metadata = {
  title: "灵感速记 | Daily Controller",
  description: "随时记录生活杂记与奇思妙想"
};

export default async function MemosPage() {
  const [memos, tags] = await Promise.all([getMemos(), getTags()]);

  return (
    <div className="min-h-screen bg-[#EAECEF] flex justify-center font-sans selection:bg-purple-100">
      <MemoListClient initialMemos={memos} initialTags={tags} />
    </div>
  );
}