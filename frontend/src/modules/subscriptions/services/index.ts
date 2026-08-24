import { http } from "@/core/api/client";
import { eventBus } from "@core/events/EventBus";
import type { SubscriptionService } from "../domain";

export const subscriptionService: SubscriptionService = {
  async createPlan(data) {
    const result: any = await http.post("/api/plans", data);
    return result.data;
  },

  async updatePlan(planId, data) {
    const result: any = await http.put(`/api/plans/${planId}`, data);
    return result.data;
  },

  async getPlanById(planId) {
    const data: any = await http.get(`/api/plans`);
    const plans = data.data || [];
    return plans.find((p: any) => p.id === planId) || null;
  },

  async getAllPlans() {
    const data: any = await http.get("/api/plans");
    return data.data || [];
  },

  async subscribe(userId, planId) {
    const result: any = await http.post("/api/subscribe", { plan_id: planId });
    const subscription = result.data;
    eventBus.emit("SubscriptionCreated", { subscriptionId: subscription?.id, userId, planId });
    return subscription;
  },

  async cancel(subscriptionId, reason) {
    await http.post("/api/unsubscribe", { subscription_id: subscriptionId, reason });
    eventBus.emit("SubscriptionCancelled", { subscriptionId, reason });
  },

  async renew(subscriptionId) {
    await http.post("/api/subscribe", { subscription_id: subscriptionId });
    eventBus.emit("SubscriptionRenewed", { subscriptionId });
  },

  async getSubscriptionById(subscriptionId) {
    const data: any = await http.get("/api/my-subscription");
    return data.data || null;
  },

  async getActiveByUserId(userId) {
    const data: any = await http.get("/api/my-subscription");
    return data.data || null;
  },

  async getHistoryByUserId(userId, params) {
    const data: any = await http.get("/api/my-subscription");
    return { items: data.data ? [data.data] : [], total: data.data ? 1 : 0 };
  },
};
