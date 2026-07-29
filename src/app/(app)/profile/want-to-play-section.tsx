"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { WantToPlayRow } from "@/lib/want-to-play";

export function WantToPlaySection({
  initialItems,
}: {
  initialItems: WantToPlayRow[];
}) {
  const [items, setItems] = useState(initialItems);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const supabase = createClient();

  async function handleRemove(id: string) {
    setRemovingId(id);
    const prev = items;
    setItems((cur) => cur.filter((item) => item.id !== id));

    const { error } = await supabase.from("want_to_play").delete().eq("id", id);
    if (error) setItems(prev);
    setRemovingId(null);
  }

  return (
    <div className="mt-10">
      <div className="flex items-baseline justify-between">
        <h2 className="font-body text-xs uppercase tracking-wide text-fairway-lite">
          Want to play
        </h2>
        {items.length > 0 && (
          <span className="text-xs text-fairway-lite">
            {items.length} on the list
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-3 rounded-[10px] border border-dashed border-line/50 bg-paper-2/50 p-6 text-center">
          <p className="text-sm text-fairway-lite">
            Nothing on the list yet. What are you chasing?
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-line/30 bg-paper-2/60 px-4 py-3"
            >
              <Link href={`/courses/${item.courseId}`} className="min-w-0 flex-1">
                <span className="block truncate font-display text-base text-ink">
                  {item.name}
                </span>
                {(item.city || item.state) && (
                  <span className="text-xs text-fairway-lite">
                    {[item.city, item.state].filter(Boolean).join(", ")}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={removingId === item.id}
                aria-label={`Remove ${item.name} from want to play`}
                className="shrink-0 text-sm text-fairway-lite underline underline-offset-4 hover:text-flag disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
