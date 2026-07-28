import { notFound } from "next/navigation";
import { DevCardGallery } from "./gallery";

// Dev-only visual test bench for the share card: sparse (new user) and dense
// (power user) data side by side. 404s in production.
export default function DevCardPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevCardGallery />;
}
