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
    if (url === "/api/status") {
      return Response.json({ liveAvailable: opts.liveAvailable ?? false, model: "claude-opus-5-5" });
    }
    if (opts.generateStatus && opts.generateStatus !== 200) {
      return Response.json(opts.errorBody, { status: opts.generateStatus });
    }
    const body = JSON.parse(String(init?.body));
    return Response.json({
      campaign: generateDemoCampaign(BriefSchema.parse(body.brief), { photoCount: body.photoCount }),
    });
  });
}

const png = (name: string) => new File([new Uint8Array(64)], name, { type: "image/png" });

beforeEach(() => {
  window.localStorage.clear();
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  let n = 0;
  URL.createObjectURL = vi.fn(() => `blob:mock-${++n}`);
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => vi.unstubAllGlobals());

type User = ReturnType<typeof userEvent.setup>;

async function fillRequired(user: User) {
  await user.type(screen.getByLabelText("Brand name"), "Atelier Noor");
  await user.type(
    screen.getByLabelText("Brand description"),
    "A small-batch label making handmade knitwear from recycled wool, playful and colourful.",
  );
  await user.type(screen.getByLabelText("Product / collection description"), "The Winter Bloom capsule of oversized cardigans.");
  await user.type(screen.getByLabelText("Campaign goal"), "Launch the capsule and drive pre-orders.");
}

async function createCampaign(user: User) {
  await user.click(screen.getByRole("button", { name: "Create Campaign" }));
  return screen.findByRole("navigation", { name: "Campaign sections" }, { timeout: 5000 });
}

function nav(name: RegExp) {
  return within(screen.getByRole("navigation", { name: "Campaign sections" })).getByRole("button", { name });
}

describe("<Studio />", () => {
  it("has no sample-brand shortcuts", () => {
    vi.stubGlobal("fetch", mockFetch());
    render(<Studio />);
    expect(screen.queryByText(/try a sample/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Maison Verre|Sora Athletic|Halden Studio/)).not.toBeInTheDocument();
  });

  it("validates required fields before calling the API", async () => {
    const fetch = mockFetch();
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(<Studio />);

    await user.click(screen.getByRole("button", { name: "Create Campaign" }));
    expect(screen.getByText("Brand name is required")).toBeInTheDocument();
    expect(screen.getByText("What should this campaign achieve?")).toBeInTheDocument();
    expect(screen.getByText(/4 fields need attention/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith("/api/generate", expect.anything());
  });

  it("validates link types and photo files inline", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const user = userEvent.setup({ applyAccept: false });
    render(<Studio />);

    const social = screen.getByRole("textbox", { name: "Instagram & TikTok references" });
    await user.type(social, "https://facebook.com/noor{Enter}");
    expect(screen.getByText("Only Instagram, TikTok links work here.")).toBeInTheDocument();

    await user.clear(social);
    await user.type(social, "instagram.com/ateliernoor{Enter}");
    expect(screen.getByRole("button", { name: "Remove instagram.com/ateliernoor" })).toBeInTheDocument();

    await user.upload(screen.getByLabelText("Upload product photos"), [
      new File(["x"], "notes.pdf", { type: "application/pdf" }),
    ]);
    expect(screen.getByText(/isn't a supported image/)).toBeInTheDocument();
  });

  it("runs the full demo workflow: brief → overview → concepts → storyboard → social → save", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const user = userEvent.setup();
    render(<Studio />);

    await fillRequired(user);
    await user.upload(screen.getByLabelText("Upload product photos"), [png("look-1.png"), png("look-2.png")]);
    expect(screen.getAllByRole("img", { name: /Product reference/ })).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Remove photo look-2.png" }));
    expect(screen.getAllByRole("img", { name: /Product reference/ })).toHaveLength(1);

    await user.type(screen.getByRole("textbox", { name: "Reference videos" }), "https://youtu.be/abc123{Enter}");
    await user.click(screen.getByRole("radio", { name: "15s" }));

    await createCampaign(user);

    // Overview: labelled as demo content, shows the photo and saved link
    expect(screen.getAllByText(/Illustrative demo/).length).toBeGreaterThan(0);
    expect(screen.getByText(/1 product photo attached as visual references \(not analysed\)/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /youtu\.be\/abc123/ })).toHaveAttribute("rel", "noopener noreferrer");

    // Concepts
    await user.click(nav(/Concepts/));
    const tabs = within(screen.getByRole("tablist", { name: "Campaign concepts" })).getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    await user.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");

    // Storyboard: 15s → 4 frames, edit and add
    await user.click(nav(/Storyboard/));
    expect(screen.getByText(/Target 15s · on time/)).toBeInTheDocument();
    const visual = screen.getByLabelText("Frame 1 visual");
    await user.clear(visual);
    await user.type(visual, "A new opening shot");
    await user.click(screen.getByRole("button", { name: "Add frame" }));
    expect(screen.getByLabelText("Frame 5 title")).toHaveValue("New frame");

    // Production
    await user.click(nav(/Production/));
    expect(screen.getByLabelText("Shot 1 director's note")).toBeInTheDocument();

    // Social
    await user.click(nav(/Social/));
    expect(screen.getByLabelText("TikTok hook 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Instagram hook 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Instagram caption text")).toBeInTheDocument();

    // Export & save
    await user.click(nav(/Export/));
    expect(screen.getByText(/Demo limitations/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save project" }));
    expect(await screen.findByText(/Project saved/)).toBeInTheDocument();

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].brief.videoLinks).toEqual(["https://youtu.be/abc123"]);
    expect(stored[0].photos).toEqual([expect.objectContaining({ name: "look-1.png" })]);
    expect(stored[0].photos[0]).not.toHaveProperty("url");
    const selected = stored[0].campaign.concepts.find((c: { id: string }) => c.id === stored[0].selectedConceptId);
    expect(selected.storyboard[0].visual).toBe("A new opening shot");
    expect(selected.storyboard).toHaveLength(5);
  });

  it("re-opens a saved project, with photo placeholders after a reload", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const user = userEvent.setup();
    const { unmount } = render(<Studio />);
    await fillRequired(user);
    await user.upload(screen.getByLabelText("Upload product photos"), [png("look-1.png")]);
    await createCampaign(user);
    await user.click(screen.getByRole("button", { name: "Save" }));
    unmount();

    render(<Studio />); // simulates a page reload: in-memory photo previews are gone
    await user.click(screen.getByRole("button", { name: /Projects/ }));
    const dialog = screen.getByRole("dialog", { name: "Saved projects" });
    await user.click(within(dialog).getByRole("button", { name: /^Atelier Noor/ }));

    expect(screen.getByLabelText("Project name")).toHaveValue("Atelier Noor — Campaign");
    expect(screen.getByText("Re-upload to preview")).toBeInTheDocument();
  });

  it("lets you edit the brief and return to the campaign", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const user = userEvent.setup();
    render(<Studio />);
    await fillRequired(user);
    await createCampaign(user);

    await user.click(screen.getByRole("button", { name: "Edit brief" }));
    expect(screen.getByLabelText("Brand name")).toHaveValue("Atelier Noor");
    await user.click(screen.getByRole("button", { name: "Back to campaign" }));
    expect(screen.getByRole("navigation", { name: "Campaign sections" })).toBeInTheDocument();
  });

  it("shows API errors and offers a demo fallback from live mode", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        liveAvailable: true,
        generateStatus: 429,
        errorBody: { error: { code: "UPSTREAM_RATE_LIMITED", message: "Claude is busy." } },
      }),
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
