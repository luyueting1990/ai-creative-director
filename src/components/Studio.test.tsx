// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateDemoCampaign } from "@/lib/demo";
import { BriefSchema } from "@/lib/schema";
import { STORAGE_KEY } from "@/lib/storage";
import { Studio } from "./Studio";

function mockFetch(opts: { liveAvailable?: boolean; generateStatus?: number; errorBody?: unknown } = {}) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/status") {
      return Response.json({ liveAvailable: opts.liveAvailable ?? false, model: "claude-opus-5-5" });
    }
    if (opts.generateStatus && opts.generateStatus !== 200) {
      return Response.json(opts.errorBody, { status: opts.generateStatus });
    }
    const body = JSON.parse(String(init?.body));
    return Response.json({ campaign: generateDemoCampaign(BriefSchema.parse(body.brief)) });
  });
}

beforeEach(() => {
  window.localStorage.clear();
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => vi.unstubAllGlobals());

async function generateFromSample(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Maison Verre/ }));
  await user.click(screen.getByRole("button", { name: /Generate campaign/ }));
  return screen.findByRole("tablist", { name: "Campaign concepts" }, { timeout: 4000 });
}

describe("<Studio />", () => {
  it("validates the brief before calling the API", async () => {
    const fetch = mockFetch();
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(<Studio />);

    await user.click(screen.getByRole("button", { name: /Generate campaign/ }));
    expect(screen.getByText("Brand name is required")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith("/api/generate", expect.anything());
  });

  it("generates three concepts in demo mode, edits and saves a project", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const user = userEvent.setup();
    render(<Studio />);

    const cards = await generateFromSample(user);
    expect(within(cards).getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByText("Demo output")).toBeInTheDocument();

    // Edit the storyboard of the first concept.
    await user.click(screen.getByRole("tab", { name: /Storyboard/ }));
    const firstVisual = screen.getByLabelText("Frame 1 visual");
    await user.clear(firstVisual);
    await user.type(firstVisual, "A new opening shot");
    expect(firstVisual).toHaveValue("A new opening shot");

    await user.click(screen.getByRole("button", { name: "Add frame" }));
    expect(screen.getByLabelText("Frame 7 title")).toHaveValue("New frame");

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Project saved")).toBeInTheDocument();

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].campaign.concepts[0].storyboard[0].visual).toBe("A new opening shot");
    expect(stored[0].campaign.concepts[0].storyboard).toHaveLength(7);
  });

  it("switches concepts and edits captions", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const user = userEvent.setup();
    render(<Studio />);
    const cards = await generateFromSample(user);

    await user.click(within(cards).getAllByRole("tab")[2]);
    expect(screen.getByLabelText("Concept title")).toHaveValue("Made by Hand");

    await user.click(screen.getByRole("tab", { name: /Captions/ }));
    expect(screen.getByLabelText("Instagram caption text")).toBeInTheDocument();
    expect(screen.getByLabelText("Pinterest caption text")).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: /Maison Verre/ }));
    await user.click(screen.getByRole("button", { name: /Generate campaign/ }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Claude is busy.");
    expect(within(alert).getByRole("button", { name: "Use demo mode" })).toBeInTheDocument();
  });

  it("disables live mode when the server has no API key", async () => {
    vi.stubGlobal("fetch", mockFetch({ liveAvailable: false }));
    render(<Studio />);
    await act(async () => {});
    expect(screen.getByRole("radio", { name: /Live/ })).toBeDisabled();
  });

  it("re-opens a saved project from the drawer", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const user = userEvent.setup();
    const { unmount } = render(<Studio />);
    await generateFromSample(user);
    await user.click(screen.getByRole("button", { name: "Save" }));
    unmount();

    render(<Studio />);
    await user.click(screen.getByRole("button", { name: /Projects/ }));
    const dialog = screen.getByRole("dialog", { name: "Saved projects" });
    await user.click(within(dialog).getByRole("button", { name: /^Maison Verre/ }));
    expect(screen.getByLabelText("Project name")).toHaveValue(
      "Maison Verre — Spring/Summer '27 \"Salt Light\" linen collection",
    );
  });
});
