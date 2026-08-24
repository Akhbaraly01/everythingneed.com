import { z } from "zod";

export const CreateRestaurantSchema = z.object({
  ownerId: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  cuisineType: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  deliveryFee: z.number().min(0).optional(),
  minimumOrder: z.number().min(0).optional(),
  estimatedDeliveryTime: z.number().int().positive().optional(),
});

export const CreateMenuItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  category: z.string().min(1),
  spicyLevel: z.number().int().min(0).max(5).optional(),
  preparationTime: z.number().int().positive().optional(),
  calories: z.number().int().positive().optional(),
  allergens: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const PlaceFoodOrderSchema = z.object({
  restaurantId: z.string().uuid(),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().int().positive(),
    options: z.record(z.string()).optional(),
    specialInstructions: z.string().optional(),
  })).min(1),
  deliveryAddress: z.string().optional(),
  specialInstructions: z.string().optional(),
});

export type CreateRestaurantInput = z.infer<typeof CreateRestaurantSchema>;
export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>;
export type PlaceFoodOrderInput = z.infer<typeof PlaceFoodOrderSchema>;
