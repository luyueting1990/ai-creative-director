// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateDemoCampaign } from "@/lib/demo";
import { BriefSchema } from "@/lib/schema";
import { STORAGE_KEY } from "@/lib/storage";
import { Studio } from "./Studio";

vi.setConfig({ testTimeout: 20_000 });

function mockFetch(opts: { liveAvailable?: boolean; generateStatus?: number; errorBody?: unknown } = {}) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/status") return Response.json({ liveAvailable: opts.liveAvailable ?? false, model: "claude-opus-5-5" });
    if (opts.generateStatus && opts.generateStatus !== 200) return Response.json(opts.errorBody, { status: opts.generateStatus });
    const body = JSON.parse(String(init?.body));
    return Response.json({ campaign: generateDemoCampaign(BriefSchema.parse(body.brief), { photoCount: body.photoCount }) });
  });
}

const png = (name: string) => new File([new Uint8Array(64)], name, { type: "image/png" });
const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");

let downloads: string[] = [];
beforeEach(() => {
  window.localStorage.clear();
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  let n = 0;
  URL.createObjectURL = vi.fn(() => `blob:mock-${++n}`);
  URL.revokeObjectURL = vi.fn();
  downloads = [];
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push(this.download);
  });
});
afterEach(() => vi.unstubAllGlobals());

type User = ReturnType<typeof userEvent.setup>;

async function fillRequired(user: User) {
  await user.type(screen.getByLabelText("Brand name"), "Atelier Noor");
  await user.type(screen.getByLabelText("About the brand"), "A small-batch label making handmade knitwear, playful and colourful.");
  await user.type(screen.getByLabelText("Product details"), "The Winter Bloom capsule of oversized cardigans.");
  await user.type(screen.getByLabelText("Campaign goal"), "Launch the capsule and drive pre-orders.");
}

const concepts = () => within(screen.getByRole("radiogroup", { name: "Campaign concepts" })).getAllByRole("radio");
const shotButtons = () => screen.getAllByRole("button", { name: /^Edit shot \d/ });

async function create(user: User) {
  await user.click(screen.getByRole("button", { name: "Create Campaign" }));
  await screen.findByRole("radiogroup", { name: "Campaign concepts" }, { timeout: 4000 });
}

describe("<Studio />", () => {
  it("shows one input page with no sample brands or section navigation", () => {
    vi.stubGlobal("fetch", mockFetch());
    render(<Studio />);
    expect(screen.getByRole("heading", { name: "Create a campaign" })).toBeInTheDocument();
    expect(screen.queryByText(/Maison Verre|Sora Athletic|Halden Studio|try a sample/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Campaign sections" })).not.toBeInTheDocument();
  });

  it("validates required fields before calling the API", async () => {
    const fetch = mockFetch();
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(<Studio />);

    await user.click(screen.getByRole("button", { name: "Create Campaign" }));
    expect(screen.getByText("Add your brand name")).toBeInTheDocument();
    expect(screen.getByText("Add a campaign goal")).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.getByLabelText("Brand name")).toHaveFocus());
    expect(fetch).not.toHaveBeenCalledWith("/api/generate", expect.anything());
  });

  it("goes from brief to exported campaign in a handful of clicks", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const user = userEvent.setup();
    render(<Studio />);
    await fillRequired(user);

    // Click 1: create → a single results page with three concepts, first selected.
    await create(user);
    expect(concepts()).toHaveLength(3);
    expect(concepts()[0]).toHaveAttribute("aria-checked", "true");
    expect(shotButtons().length).toBeGreaterThanOrEqual(4);
    expect(shotButtons().length).toBeLessThanOrEqual(6);

    // Click 2: compare another idea — the storyboard updates in place.
    const firstShot = shotButtons()[0].getAttribute("aria-label");
    await user.click(concepts()[2]);
    expect(concepts()[2]).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("region", { name: "Storyboard" })).toHaveTextContent(concepts()[2].textContent!.replace(/\s+/g, " ").split(" ")[0]);
    expect(shotButtons()[0].getAttribute("aria-label")).not.toBe(firstShot);

    // Click 3: export.
    await user.click(screen.getByRole("button", { name: "Export Campaign" }));
    expect(downloads).toEqual(["atelier-noor-campaign.md"]);
    expect(await screen.findByText("Campaign exported")).toBeInTheDocument();
  });

  it("edits a shot inline and autosaves the project", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const user = userEvent.setup();
    render(<Studio />);
    await fillRequired(user);
    await user.upload(screen.getByLabelText("Upload product photos"), [png("look-1.png"), png("look-2.png")]);
    await create(user);

    // Product shots show uploaded photos.
    expect(screen.getAllByRole("img", { name: /^Shot \d reference: look-/ }).length).toBeGreaterThan(0);

    await user.click(shotButtons()[0]);
    const dialog = screen.getByRole("dialog", { name: "Edit shot 1" });
    const what = within(dialog).getByLabelText("What we see");
    await user.clear(what);
    await user.type(what, "Opening shot on the model");
    await user.click(within(dialog).getByRole("button", { name: "Use photo 2: look-2.png" }));
    await user.click(within(dialog).getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(shotButtons()[0]).toHaveTextContent("Opening shot on the model");

    await vi.waitFor(() => {
      const [project] = stored();
      const concept = project.campaign.concepts.find((c: { id: string }) => c.id === project.selectedConceptId);
      expect(concept.shots[0]).toMatchObject({ description: "Opening shot on the model" });
      expect(project.photos.map((p: { name: string }) => p.name)).toEqual(["look-1.png", "look-2.png"]);
      expect(project.photos[0]).not.toHaveProperty("url");
    });
    expect(screen.getAllByText("Saved in this browser")[0]).toBeInTheDocument();
  });

  it("keeps captions and production notes in one collapsed More details section", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const user = userEvent.setup();
    render(<Studio />);
    await fillRequired(user);
    await create(user);

    const details = screen.getByText("More details").closest("details")!;
    expect(details).not.toHaveAttribute("open");
    await user.click(screen.getByText("More details"));
    expect(details).toHaveAttribute("open");
    expect(within(details).getByLabelText("Instagram caption")).toBeInTheDocument();
    expect(within(details).getByLabelText("TikTok caption")).toBeInTheDocument();
    expect(within(details).getByLabelText("Shot 1 direction")).toBeInTheDocument();
  });

  it("puts Edit brief, Save and Regenerate in a secondary menu", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const user = userEvent.setup();
    render(<Studio />);
    await user.type(screen.getByLabelText("Brand name"), "Atelier Noor");
    await user.type(screen.getByLabelText("About the brand"), "Playful handmade knitwear label.");
    await user.type(screen.getByLabelText("Product details"), "Cardigans");
    await user.type(screen.getByLabelText("Campaign goal"), "Launch it");
    await create(user);

    expect(screen.queryByRole("button", { name: "Regenerate" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "More actions" }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getAllByRole("menuitem").map((m) => m.textContent)).toEqual(
      expect.arrayContaining(["Edit brief", "Save", "Regenerate", "Download project file"]),
    );

    await user.click(within(menu).getByRole("menuitem", { name: "Save" }));
    expect(await screen.findByText("Saved")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit brief" }));
    expect(screen.getByLabelText("Brand name")).toHaveValue("Atelier Noor");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(concepts()).toHaveLength(3);
  });

  it("re-opens a saved project with photo placeholders after a reload", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const user = userEvent.setup();
    const { unmount } = render(<Studio />);
    await fillRequired(user);
    await user.type(screen.getByRole("textbox", { name: "Reference links" }), "instagram.com/ateliernoor{Enter}");
    await user.upload(screen.getByLabelText("Upload product photos"), [png("look-1.png")]);
    await create(user);
    await vi.waitFor(() => expect(stored()).toHaveLength(1));
    unmount();

    render(<Studio />); // like a page reload: in-memory photo previews are gone
    await user.click(screen.getByRole("button", { name: /Projects/ }));
    await user.click(within(screen.getByRole("dialog", { name: "Saved projects" })).getByRole("button", { name: /^Atelier Noor/ }));

    expect(screen.getByLabelText("Project name")).toHaveValue("Atelier Noor campaign");
    expect(screen.getAllByText("Re-upload photo to preview").length).toBeGreaterThan(0);
    await user.click(screen.getByText("More details"));
    expect(screen.getByRole("link", { name: /instagram\.com\/ateliernoor/ })).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows API errors and offers a demo fallback from live mode", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ liveAvailable: true, generateStatus: 429, errorBody: { error: { code: "UPSTREAM_RATE_LIMITED", message: "Claude is busy." } } }),
    );
    const user = userEvent.setup();
    render(<Studio />);
    const live = screen.getByRole("radio", { name: /Live/ });
    await vi.waitFor(() => expect(live).toBeEnabled());
    await user.click(live);
    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Create Campaign" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Claude is busy.");
    expect(within(alert).getByRole("button", { name: "Use demo mode" })).toBeInTheDocument();
    expect(screen.getByLabelText("Brand name")).toHaveValue("Atelier Noor");
  });

  it("disables live mode when the server has no API key", async () => {
    vi.stubGlobal("fetch", mockFetch({ liveAvailable: false }));
    render(<Studio />);
    await act(async () => {});
    expect(screen.getByRole("radio", { name: /Live/ })).toBeDisabled();
  });
});
