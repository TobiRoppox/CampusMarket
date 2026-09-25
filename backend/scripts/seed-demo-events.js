import "dotenv/config";
import { closeDb, query } from "../src/db/index.js";

// Run with `npm run seed:events`. Only these demo records are updated on rerun.
const [sellerStall] = await query("SELECT * FROM stalls WHERE name = 'Campus Eats' AND status = 'approved' LIMIT 1");
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
for (const example of examples) {
  await query(
    `INSERT INTO events (id, name, is_demo, date, start_date, end_date, location, description, image_url)
     VALUES ($1, $2, TRUE, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, date = EXCLUDED.date, start_date = EXCLUDED.start_date,
       end_date = EXCLUDED.end_date, location = EXCLUDED.location, description = EXCLUDED.description, image_url = EXCLUDED.image_url`,
    [example.id, example.name, dateAt(example.offset, "00:00:00").slice(0, 10), dateAt(example.offset, "00:00:00"),
      dateAt(example.offset, "23:59:59"), example.location, example.description, `/images/buyer/${example.image}`],
  );
  await query(
    `INSERT INTO event_stalls (id, event_id, stall_id, seller_id, name, category, description, stall_number, location, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $9)
     ON CONFLICT (id) DO UPDATE SET stall_id = EXCLUDED.stall_id, seller_id = EXCLUDED.seller_id, name = EXCLUDED.name,
       category = EXCLUDED.category, description = EXCLUDED.description, location = EXCLUDED.location, status = EXCLUDED.status`,
    [`${example.id}-campus-eats`, example.id, sellerStall.id, sellerStall.owner_id, sellerStall.name, sellerStall.category,
      sellerStall.description, example.location, example.offset < 0 ? "closed" : "open"],
  );
}
await closeDb();
console.log("Seeded 3 demo events with Campus Eats.");
