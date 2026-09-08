import fs from "node:fs";

// Run with `npm run seed:events`. Only these demo records are updated on rerun.
const file = new URL("../src/data/market-data.json", import.meta.url);
const state = JSON.parse(fs.readFileSync(file, "utf8"));
const sellerStall = state.stalls.find((stall) => stall.name === "Campus Eats" && stall.status === "approved");
if (!sellerStall) throw new Error("The approved Campus Eats sample stall is required.");
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
const dateAt = (offset, time) => {
  const day = new Date(`${today}T12:00:00+08:00`);
  day.setUTCDate(day.getUTCDate() + offset);
  return `${day.toISOString().slice(0, 10)}T${time}+08:00`;
};
const examples = [
  { id: "demo-campus-food-fest", name: "Campus Food Fest", offset: 0,
    location: "CSUCC Grounds", image: "event-foodfest.png",
    description: "Sample event for presentation. Discover student-run food stalls, compare meals, and visit Campus Eats to browse products. This fair brings campus food sellers together in one place." },
  { id: "demo-student-enterprise-fair", name: "Student Enterprise Fair", offset: 7,
    location: "CSUCC Covered Court", image: "event-hiringfair.png",
    description: "Sample event for presentation. Meet student entrepreneurs and explore their campus businesses. Buyers can plan a visit and view participating stalls; sellers can apply to join through their seller account." },
  { id: "demo-campus-eco-market", name: "Campus Eco Market", offset: -7,
    location: "CSUCC Activity Center", image: "event-ecofair.png",
    description: "Sample past event for presentation. A campus market encouraging reusable packaging and mindful shopping. Use this example to demonstrate event history and revisit participating sellers." },
];
state.events ??= [];
state.eventStalls ??= [];
for (const example of examples) {
  const event = {
    id: example.id, name: example.name, is_demo: true,
    date: dateAt(example.offset, "00:00:00").slice(0, 10),
    start_date: dateAt(example.offset, "00:00:00"),
    end_date: dateAt(example.offset, "23:59:59"),
    location: example.location, description: example.description,
    image_url: `/images/buyer/${example.image}`, stall_count: 1,
    created_at: new Date().toISOString(),
  };
  const index = state.events.findIndex((item) => item.id === event.id);
  if (index < 0) state.events.push(event);
  else state.events[index] = { ...state.events[index], ...event };
  const entry = {
    id: `${event.id}-campus-eats`, event_id: event.id,
    stall_id: sellerStall.id, seller_id: sellerStall.owner_id,
    name: sellerStall.name, category: sellerStall.category,
    description: sellerStall.description, stall_number: 1,
    location: example.location, status: example.offset < 0 ? "closed" : "open",
  };
  const entryIndex = state.eventStalls.findIndex((item) => item.id === entry.id);
  if (entryIndex < 0) state.eventStalls.push(entry);
  else state.eventStalls[entryIndex] = entry;
}
fs.writeFileSync(file, JSON.stringify(state, null, 2));
console.log("Seeded 3 demo events with Campus Eats. Restart the backend if it is already running.");
