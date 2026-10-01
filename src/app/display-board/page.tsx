import { redirect } from "next/navigation";

// The live display board now lives on the Cause List Watcher page. Kept as a
// redirect so old bookmarks and home-screen shortcuts still land there.
export default function DisplayBoardPage() {
  redirect("/cause-list");
}
