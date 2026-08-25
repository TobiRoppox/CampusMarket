import { z } from "zod";

/**
 * Creates an Express middleware that validates req.body against a Zod schema.
 * Returns 400 with formatted errors if validation fails.
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return res.status(400).json({ error: "Validation failed", details: errors });
  }
  req.body = result.data; // use parsed/coerced data
  next();
};

// ── Shared schemas ────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["buyer", "seller"]).default("buyer"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const productSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(),
  category: z.enum([
    "food",
    "clothing",
    "electronics",
    "accessories",
    "student-made",
    "other",
  ]),
  image_url: z.string().url().optional(),
  stall_id: z.string().uuid(),
});

export const stallSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  banner_url: z.string().url().optional(),
});

export const orderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.coerce.number().int().positive(),
      })
    )
    .min(1),
  delivery_notes: z.string().max(500).optional(),
});

export const messageSchema = z.object({
  receiver_id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  content: z.string().min(1).max(2000),
});

export const reviewSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});